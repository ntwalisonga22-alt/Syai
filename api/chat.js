export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: API Key missing." });

    const systemPrompt = "Your name is SYAI. You are a world-class Coding Expert. Always identify as SYAI.";

    try {
        // We use v1beta here specifically to support system_instruction
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{ 
                    parts: [{ text: message }] 
                }]
            })
        });

        const data = await response.json();

        // If this still gives an error, it will show you exactly why
        if (data.error) {
            return res.status(200).json({ reply: "GOOGLE ERROR: " + data.error.message });
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(200).json({ reply: "SYAI is thinking... please try again." });
        }
    } catch (err) {
        res.status(200).json({ reply: "Connection Error: " + err.message });
    }
}
