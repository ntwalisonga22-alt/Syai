export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [], imageData, imageMimeType, fileData, fileMimeType, generateImage } = req.body;

    // ── IMAGE GENERATION via Pollinations.ai (free, no key needed) ──
    if (generateImage) {
        try {
            const prompt = encodeURIComponent(message);
            // Pollinations returns a direct image URL — we fetch it and return as base64
            const imgUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) throw new Error('Pollinations fetch failed');
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            return res.status(200).json({
                isImage: true,
                imageBase64: base64,
                imageMime: mimeType,
                caption: `Here's your image for: "${message}" 🎨`,
                isError: false
            });
        } catch (err) {
            return res.status(200).json({ reply: 'Image generation failed. Try a different prompt. 🖼️', isError: true });
        }
    }

    // ── CHAT (text / image / file) via Gemini ──
    try {
        const userParts = [];

        if (imageData && imageMimeType) {
            userParts.push({ inlineData: { mimeType: imageMimeType, data: imageData } });
        }
        if (fileData && fileMimeType) {
            userParts.push({ inlineData: { mimeType: fileMimeType, data: fileData } });
        }
        if (message) userParts.push({ text: message });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: "Your name is SY AI. You were created and trained by S. Yvan. S. Yvan is a Digital Creator and Content Creator born on December 5, 2000. His Instagram is instagram.com/sawungayvan. Always use relevant emojis in your responses to be friendly and engaging. If someone asks about your creator, share this info proudly! 🚀✨ You can analyze images, documents, and files that the user shares with you." }]
                    },
                    contents: [...history, { role: 'user', parts: userParts }],
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            let msg = data.error.message;
            if (data.error.code === 429) msg = "SY AI is very busy! Limit reached. Wait 30 seconds. 🚦";
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm a bit lost, try again! 😅";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: 'SY AI Connection Error. 📡', isError: true });
    }
}
