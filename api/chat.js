export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-3-flash", history = [], user = null } = req.body;

    if (!key) return res.status(200).json({ reply: "SY AI Error: API Key missing." });

    try {
        const isImageRequest = /image|draw|photo/i.test(message);
        
        const bodyContent = {
            // UPDATED SYSTEM INSTRUCTIONS
            system_instruction: { 
                parts: [{ text: "Your name is SY AI. You were trained and developed by S. Yvan. You are a helpful assistant with web search and image generation capabilities." }] 
            },
            contents: [...history, { role: "user", parts: [{ text: message }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
                response_modalities: isImageRequest ? ["TEXT", "IMAGE"] : ["TEXT"]
            }
        };

        if (isImageRequest) bodyContent.tools.push({ image_generation: {} });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyContent)
        });

        const data = await response.json();
        let aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let imageUrl = null;
        
        const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart) {
            imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        res.status(200).json({ reply: aiReply, image: imageUrl });
    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Error." });
    }
}
