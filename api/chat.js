export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    
    // This matches the 'model' and 'message' sent by your HTML
    const { message, model, history = [], user = null } = req.body;

    if (!key) return res.status(200).json({ reply: "SY AI Error: API Key missing in environment." });

    try {
        // Use the model sent by the user, or default to flash if something goes wrong
        const selectedModel = model || "gemini-2.5-flash";
        
        const isImageRequest = /image|draw|photo|picture/i.test(message);
        
        const bodyContent = {
            system_instruction: { 
                parts: [{ text: "Your name is SY AI. You were trained and developed by S. Yvan. You are a highly advanced AI assistant." }] 
            },
            contents: [...history, { role: "user", parts: [{ text: message }] }],
            tools: [{ google_search: {} }], // Enables real-time web search
            generationConfig: {
                response_modalities: isImageRequest ? ["TEXT", "IMAGE"] : ["TEXT"]
            }
        };

        // Add image tool only if requested
        if (isImageRequest) bodyContent.tools.push({ image_generation: {} });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyContent)
        });

        const data = await response.json();

        // Check if Google returned an error (like "Model not found")
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            return res.status(200).json({ reply: `SY AI Error: ${data.error.message}` });
        }

        let aiReply = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "";
        
        // Find the image in the response if it exists
        let imageUrl = null;
        const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart) {
            imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        res.status(200).json({ reply: aiReply, image: imageUrl });

    } catch (err) {
        console.error("SY AI Server Error:", err);
        res.status(500).json({ reply: "SY AI is currently having trouble connecting to the brain. Please check your internet or API key." });
    }
}
