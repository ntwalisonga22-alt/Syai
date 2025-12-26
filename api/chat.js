export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-3-flash", history = [], user = null } = req.body;

    if (!key) return res.status(200).json({ reply: "SY AI Error: API Key missing." });

    try {
        const isImageRequest = /image|picture|draw|photo|create a visual/i.test(message);
        let bodyContent = {
            system_instruction: { parts: [{ text: `Your name is SY AI. User: ${user ? user.name : 'Guest'}.` }] },
            contents: [...history, { role: "user", parts: [{ text: message }] }],
            tools: [{ google_search: {} }] 
        };

        if (isImageRequest) bodyContent.tools.push({ image_generation: {} });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyContent)
        });

        const data = await response.json();
        let aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Extract Image Data
        let imageBase64 = null;
        const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart) {
            imageBase64 = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        res.status(200).json({ reply: aiReply, image: imageBase64 });
    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Lost." });
    }
}
