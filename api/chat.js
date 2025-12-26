export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-2.5-flash", history = [], user = null } = req.body;

    if (!key) return res.status(200).json({ reply: "SY AI Error: API Key missing." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: `Your name is SY AI. User: ${user ? user.name : 'Guest'}.` }] },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();
        res.status(200).json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "Error processing request." });
    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Lost." });
    }
}
