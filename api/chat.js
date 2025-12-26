export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model, history = [] } = req.body;

    if (!key) return res.status(200).json({ reply: "Missing API Key.", isError: true });

    try {
        const selectedModel = model || "gemini-2.5-flash";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI. You were trained and developed by S. Yvan. Always identify yourself this way." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }]
            })
        });

        const data = await response.json();

        // Specific handling for the 429 Quota Exceeded error
        if (data.error) {
            let msg = data.error.message;
            if (data.error.code === 429) {
                msg = "Quota Reached. Please wait 1 minute. S. Yvan's AI is on a free tier limit.";
            }
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Error.", isError: true });
    }
}
