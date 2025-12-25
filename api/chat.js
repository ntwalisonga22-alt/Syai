export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        return res.status(200).json({ reply: "SYSTEM ERROR: API Key missing in Vercel Settings." });
    }

    if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

    const { message } = req.body;

    // We will try the newest model first, then fall back to the older one if needed
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
    
    for (const modelName of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
            }
            
            // If Google says "not found" for the first model, the loop continues to the next one
            if (data.error && data.error.code !== 404) {
                return res.status(200).json({ reply: "GOOGLE ERROR: " + data.error.message });
            }
        } catch (err) {
            console.error("Try failed for " + modelName);
        }
    }

    res.status(200).json({ reply: "All connection attempts failed. Please check your API key status." });
}
