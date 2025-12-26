export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-3-flash", checkStatus = false } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: API Key missing in environment." });

    // NEW: Health Check Logic
    if (checkStatus) {
        try {
            const test = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await test.json();
            if (data.models) return res.status(200).json({ status: "Connected", modelCount: data.models.length });
            return res.status(200).json({ status: "Error", message: data.error?.message || "Invalid Key" });
        } catch (e) { return res.status(200).json({ status: "Offline" }); }
    }

    try {
        // Updated to use v1beta with the 2025-ready model IDs
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } 
        
        // Detailed error reporting to find out exactly why it's failing
        return res.status(200).json({ 
            reply: `SY AI Error: ${data.error?.message || "Unknown API Response Format"}` 
        });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Failed." });
    }
}
