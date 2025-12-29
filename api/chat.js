export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan (born 12/05/2000). You have live web access. Use emojis! 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();
        
        // Error handling for "Busy" message shown in your screenshots
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "SY AI is very busy! S. Yvan's Lite server limit reached. Wait 30s.", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm online, but that search was tricky. Ask me something else! 🌐";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI is currently recalibrating. Try again! 📡", isError: true });
    }
}
