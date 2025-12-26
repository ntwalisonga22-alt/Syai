export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: API Key missing." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SYAI, a coding expert." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();

        // CHECK FOR RATE LIMIT (429 ERROR)
        if (response.status === 429) {
            return res.status(200).json({ 
                errorType: "QUOTA", 
                reply: "SYAI is cooling down. Please wait 60 seconds.",
                cooldownTime: 60 
            });
        }

        if (data.candidates) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(200).json({ reply: "SYAI is busy. Try again in a moment." });
        }
    } catch (err) {
        res.status(200).json({ reply: "Connection Error." });
    }
}
