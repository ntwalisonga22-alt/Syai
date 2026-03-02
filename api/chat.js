export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. You are a fast, smart school assistant. Answer directly using your internal knowledge. 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }]
                // 🚫 NO TOOLS HERE - This prevents the error!
            })
        });

        const data = await response.json();

        // Check if API is exhausted
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ SY AI is busy. Wait for the 'Ding' sound! 🔔", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm ready! What's your next question? ✨";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 Connection busy. Try again!", isError: true });
    }
}
