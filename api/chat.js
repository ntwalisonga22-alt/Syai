export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [], imageData, imageMimeType, fileData, fileMimeType, generateImage } = req.body;

    // ── IMAGE GENERATION via Pollinations.ai ──
    if (generateImage) {
        const prompt = encodeURIComponent(message.trim());
        const seed = Math.floor(Math.random() * 999999);
        const imgUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;
        return res.status(200).json({
            isImageUrl: true,
            imageUrl: imgUrl,
            caption: `Here's your image for: "${message}"`,
            isError: false
        });
    }

    // ── CHAT via Gemini with Google Search grounding (live internet) ──
    try {
        const userParts = [];
        if (imageData && imageMimeType) userParts.push({ inlineData: { mimeType: imageMimeType, data: imageData } });
        if (fileData && fileMimeType)   userParts.push({ inlineData: { mimeType: fileMimeType,  data: fileData  } });
        if (message) userParts.push({ text: message });

        const requestBody = {
            system_instruction: {
                parts: [{ text: `You are SY AI, a smart, helpful, and friendly assistant created and trained by S. Yvan — a Digital Creator and Content Creator born on December 5, 2000 (Instagram: instagram.com/sawungayvan).

Your personality:
- Clear, direct, and genuinely helpful
- Friendly and conversational without being over the top
- Use emojis only when they naturally add value — never force them
- For code: always use proper markdown code blocks with the language specified (e.g. \`\`\`python)
- For technical questions: be precise and thorough
- For creative tasks: be expressive and original
- For analysis (images, files, documents): be detailed and structured
- You have access to live Google Search — use it to answer questions about current events, news, prices, weather, sports scores, and anything that requires up-to-date information
- When you use web search, you can mention that the information is from the web
- If someone asks who made you, answer proudly about S. Yvan` }]
            },
            contents: [...history, { role: 'user', parts: userParts }],
            // Enable Google Search grounding for live internet access
            tools: [{ googleSearch: {} }],
            toolConfig: {
                functionCallingConfig: { mode: 'AUTO' }
            }
        };

        // Use gemini-2.0-flash for search grounding (supports it better)
        const model = (imageData || fileData) ? 'gemini-2.5-flash-lite' : 'gemini-2.0-flash';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        const data = await response.json();

        if (data.error) {
            // If grounding fails, retry without it
            if (data.error.code === 400) {
                return await chatWithoutGrounding(key, userParts, history, res);
            }
            let msg = data.error.message;
            if (data.error.code === 429) msg = "I'm handling too many requests right now. Please wait a moment and try again.";
            return res.status(200).json({ reply: msg, isError: true });
        }

        // Extract text from response (grounding may return multiple parts)
        const parts = data.candidates?.[0]?.content?.parts || [];
        const aiReply = parts.map(p => p.text || '').join('').trim()
            || "I didn't quite get that. Could you try again?";

        // Check if grounding/search was used
        const usedSearch = data.candidates?.[0]?.groundingMetadata?.webSearchQueries?.length > 0;

        res.status(200).json({
            reply: aiReply,
            isError: false,
            usedSearch: usedSearch || false
        });

    } catch (err) {
        res.status(200).json({ reply: 'Connection error. Please check your network and try again.', isError: true });
    }
}

// Fallback: chat without search grounding (for image/file analysis)
async function chatWithoutGrounding(key, userParts, history, res) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: `You are SY AI, a smart, helpful, and friendly assistant created and trained by S. Yvan. Use emojis only when they naturally fit. For code, always use markdown code blocks with the language specified.` }]
                    },
                    contents: [...history, { role: 'user', parts: userParts }],
                })
            }
        );
        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite get that. Could you try again?";
        return res.status(200).json({ reply: aiReply, isError: false });
    } catch (err) {
        return res.status(200).json({ reply: 'Connection error. Please try again.', isError: true });
    }
}
