export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: SYAI Core Key is missing." });

    // Personality configuration
    const systemPrompt = "Your name is SYAI. You are a world-class Coding Expert.";

    try {
        // UPDATED MODEL: Using gemini-2.0-flash which is the current 2025 standard
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
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

        // If Google sends a 404 again, it will tell us exactly why here
        if (data.error) {
            return res.status(200).json({ reply: "SYAI SYSTEM ERROR: " + data.error.message });
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(200).json({ reply: "SYAI is standing by. Please repeat your command." });
        }
    } catch (err) {
        res.status(200).json({ reply: "Connection failed. Check your Vercel logs." });
    }
}
