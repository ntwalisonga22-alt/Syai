export default async function handler(req, res) {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
        return res.status(500).json({ reply: "API Key is missing. Please add GEMINI_API_KEY to Vercel Settings." });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        // If Google sends an error (like an invalid key), this will show you why
        if (data.error) {
            return res.status(500).json({ reply: "Google AI Error: " + data.error.message });
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply });
        } else {
            res.status(500).json({ reply: "The AI brain is unresponsive. Check your API quota." });
        }
    } catch (error) {
        res.status(500).json({ reply: "Connection failed. Please try again." });
    }
}
