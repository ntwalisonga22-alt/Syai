export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        // Using Gemini 1.5 Flash for maximum speed and stability
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. You are a fast, smart, and helpful school assistant. Answer questions directly using your internal knowledge. 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }]
                // TOOLS REMOVED: No more Live Search to prevent 'Processing' errors
            })
        });

        const data = await response.json();

        // Handle quota limits
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ SY AI is busy right now. Wait for the 'Ding'! 🔔", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here! Could you please repeat that? ✨";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 SY AI Connection Glitch. Try again!", isError: true });
    }
}
