export default async function handler(req, res) {
    // 1. Get the key from your Vercel settings
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
        return res.status(200).json({ reply: "SYSTEM ERROR: API Key not found in Vercel. Please add GEMINI_API_KEY to Environment Variables." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    const { message } = req.body;

    try {
        // 2. STABLE URL: This is the exact URL Google requires for Gemini 1.5 Flash
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        // 3. CHECK FOR GOOGLE ERRORS
        if (data.error) {
            return res.status(200).json({ reply: "GOOGLE ERROR: " + data.error.message });
        }

        // 4. SEND RESPONSE TO YOUR SITE
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply: aiReply });
        } else {
            res.status(200).json({ reply: "The AI received the message but didn't know what to say. Try again." });
        }

    } catch (error) {
        res.status(200).json({ reply: "CONNECTION ERROR: Could not reach Google AI." });
    }
}
