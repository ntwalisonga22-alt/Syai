export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model, history = [], user = null } = req.body;

    try {
        const selectedModel = model || "gemini-2.5-flash";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI. You were trained and developed by S. Yvan. You are a highly advanced assistant." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }]
            })
        });

        const data = await response.json();

        // Detect Quota Error specifically
        if (data.error) {
            let userFriendlyError = "SY AI: My brain is tired (Quota Reached). Please wait a minute.";
            if (data.error.code === 429) userFriendlyError = "Limit Reached: Please wait 60 seconds before asking S. Yvan's AI again.";
            
            return res.status(200).json({ 
                reply: userFriendlyError, 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to answer that.";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Error: Connection Failed.", isError: true });
    }
}
