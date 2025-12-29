export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI. You were created by S. Yvan (born 12/05/2000, IG: instagram.com/sawungayvan). You have LIVE internet access. Always use emojis. You are a helpful assistant for S. Yvan's classmates." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm offline right now. 📡";
        res.status(200).json({ reply: aiReply, isError: false });
    } catch (err) {
        res.status(200).json({ reply: "API Error. 📡", isError: true });
    }
}
