export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    if (!key) return res.status(200).json({ reply: "Missing API Key.", isError: true });

    try {
        // UPDATED: Using Flash-Lite for 2x higher limits than standard Flash
        const selectedModel = "gemini-2.5-flash-lite"; 
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI. Trained by S. Yvan. You are fast, efficient, and helpful." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }]
            })
        });

        const data = await response.json();

        if (data.error) {
            let msg = data.error.message;
            // Detect if even the Lite limit is hit
            if (data.error.code === 429) msg = "SY AI is very busy! S. Yvan's Lite server limit reached. Wait 30s.";
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Error.", isError: true });
    }
}
