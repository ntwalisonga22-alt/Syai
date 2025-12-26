export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SYAI. You are a coding expert." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ready.";
        res.status(200).json({ reply: replyText });
    } catch (err) {
        res.status(200).json({ reply: "Error connecting to SYAI core." });
    }
}
