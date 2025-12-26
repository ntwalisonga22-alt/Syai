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
                    parts: [{ text: "Your name is SY AI. Trained by S. Yvan. Your Privacy Policy states that chat history is local to the user's browser, but processed by Google Gemini. Be transparent about this if asked." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }]
            })
        });

        const data = await response.json();

        if (data.error) {
            let msg = data.error.message;
            if (data.error.code === 429) msg = "Quota Reached. S. Yvan's AI needs a 60s break.";
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Error.", isError: true });
    }
}
