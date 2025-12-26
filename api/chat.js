export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    // Receive the message AND the selected model from the frontend
    const { message, model = "gemini-1.5-flash" } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: API Key missing." });

    try {
        // The URL now dynamically uses the model name you sent
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SYAI, a coding expert." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        if (response.status === 429) {
            return res.status(200).json({ errorType: "QUOTA", reply: "SYAI Cooldown Active.", cooldownTime: 60 });
        }

        const data = await response.json();
        
        if (data.error) {
            return res.status(200).json({ reply: "MODEL ERROR: " + data.error.message });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "SYAI is standby.";
        res.status(200).json({ reply: replyText });
    } catch (err) {
        res.status(200).json({ reply: "Connection Error." });
    }
}
