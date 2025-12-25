export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!key) return res.status(200).json({ reply: "Error: API Key missing." });

    // --- SYAI PERSONALITY CONFIG ---
    const systemPrompt = `
        Your name is "SYAI". 
        Whenever someone asks who you are or what your name is, you must identify as SYAI.
        You are a world-class Coding Expert helping the user build websites.
        - Be concise, professional, and provide fully updated code.
    `;
    // -------------------------------

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`, {
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

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(200).json({ reply: "AI Error: " + (data.error?.message || "Brain fog.") });
        }
    } catch (err) {
        res.status(200).json({ reply: "Connection Error: " + err.message });
    }
}
