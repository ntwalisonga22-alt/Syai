export default async function handler(req, res) {
    const gemini_key = process.env.GEMINI_API_KEY;
    const hf_token = process.env.HUGGINGFACE_TOKEN;
    const { message, history = [], imageData, imageMimeType, fileData, fileMimeType, generateImage } = req.body;

    // ── FREE IMAGE GENERATION (With Auto-Retry) ──
    if (generateImage) {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(
                    "https://router.huggingface.co/hf-inference/v1/models/black-forest-labs/FLUX.1-schnell",
                    {
                        headers: { 
                            Authorization: `Bearer ${hf_token}`,
                            "Content-Type": "application/json"
                        },
                        method: "POST",
                        body: JSON.stringify({ inputs: message }),
                    }
                );

                // If model is loading (503), wait and retry
                if (response.status === 503) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds
                    continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    return res.status(200).json({ 
                        reply: `Image Error: ${errorData.error || 'The model is currently busy.'}`, 
                        isError: true 
                    });
                }

                const blob = await response.blob();
                const buffer = Buffer.from(await blob.arrayBuffer());
                const base64Image = buffer.toString('base64');

                return res.status(200).json({
                    isImage: true,
                    imageBase64: base64Image,
                    imageMime: "image/webp",
                    caption: `Generated for you: ${message} 🎨`,
                    isError: false
                });

            } catch (err) {
                return res.status(200).json({ reply: 'SY AI image engine connection error. 📡', isError: true });
            }
        }
        return res.status(200).json({ reply: "The engine is taking too long to wake up. Please try again in 1 minute! ⏳", isError: true });
    }

    // ── CHAT (Gemini 2.5 Flash-Lite) ──
    try {
        const userParts = [];
        if (imageData && imageMimeType) userParts.push({ inlineData: { mimeType: imageMimeType, data: imageData } });
        if (fileData && fileMimeType) userParts.push({ inlineData: { mimeType: fileMimeType, data: fileData } });
        if (message) userParts.push({ text: message });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${gemini_key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: "Your name is SY AI. You were created and trained by S. Yvan. S. Yvan is a Digital Creator and Content Creator born on May 12, 2000. His Instagram is instagram.com/sawungayvan. Always use relevant emojis in your responses to be friendly and engaging. 🚀✨ You can also analyze images and documents." }]
                    },
                    contents: [...history, { role: 'user', parts: userParts }],
                })
            }
        );

        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm a bit lost, try again! 😅";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: 'SY AI Connection Error. 📡', isError: true });
    }
}
