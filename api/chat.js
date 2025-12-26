export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: SYAI Core Key is missing." });

    // Personality configuration
    const systemPrompt = "Your name is SYAI. You are a world-class Coding Expert. Always identify as SYAI.";

    try {
        // Using v1beta for system_instruction support and gemini-1.5-flash for reliability
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

        // HANDLE QUOTA / RATE LIMITS (Error 429)
        if (response.status === 429) {
            return res.status(200).json({ 
                errorType: "QUOTA", 
                reply: "SYAI is cooling down (Free Tier limit reached). Please wait a moment.",
                cooldownTime: 60 
            });
        }

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ reply: "SYAI SYSTEM ERROR: " + data.error.message });
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(200).json({ reply: "SYAI is standing by. Please repeat your command." });
        }
    } catch (err) {
        res.status(200).json({ reply: "Connection failed. Please check your internet." });
    }
}
