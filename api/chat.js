export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [], imageData, imageMimeType, fileData, fileMimeType, generateImage } = req.body;

    // ── IMAGE GENERATION ──
    if (generateImage) {
        try {
            const prompt = message;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
                        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                    })
                }
            );
            const data = await response.json();
            if (data.error) return res.status(200).json({ reply: `Image generation error: ${data.error.message}`, isError: true });

            // find image part in response
            const parts = data.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find(p => p.inlineData);
            const textPart = parts.find(p => p.text);

            if (imgPart) {
                return res.status(200).json({
                    isImage: true,
                    imageBase64: imgPart.inlineData.data,
                    imageMime: imgPart.inlineData.mimeType,
                    caption: textPart?.text || '',
                    isError: false
                });
            } else {
                return res.status(200).json({ reply: textPart?.text || "Couldn't generate image. Try a different prompt.", isError: false });
            }
        } catch (err) {
            return res.status(200).json({ reply: 'Image generation failed. 📡', isError: true });
        }
    }

    // ── CHAT (text / image / file) ──
    try {
        // build the user message parts
        const userParts = [];

        // attach image if provided
        if (imageData && imageMimeType) {
            userParts.push({ inlineData: { mimeType: imageMimeType, data: imageData } });
        }

        // attach file (PDF, etc.) if provided
        if (fileData && fileMimeType) {
            userParts.push({ inlineData: { mimeType: fileMimeType, data: fileData } });
        }

        // text message
        if (message) userParts.push({ text: message });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: "Your name is SY AI. You were created and trained by S. Yvan. S. Yvan is a Digital Creator and Content Creator born on December 5, 2000. His Instagram is instagram.com/sawungayvan. Always use relevant emojis in your responses to be friendly and engaging. If someone asks about your creator, share this info proudly! 🚀✨ You can also analyze images, documents, and files that the user shares with you." }]
                    },
                    contents: [...history, { role: 'user', parts: userParts }],
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            let msg = data.error.message;
            if (data.error.code === 429) msg = "SY AI is very busy! Limit reached. Wait 30s. 🚦";
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm a bit lost, try again! 😅";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: 'SY AI Connection Error. 📡', isError: true });
    }
}
