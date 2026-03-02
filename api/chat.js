export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        // Using the original stable 1.5 Flash model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. You are a fast, helpful school assistant. Use your internal knowledge to answer clearly. 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }]
            })
        });

        const data = await response.json();

        // Handle the API limit (429) clearly
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ SY AI is busy. Please wait 60 seconds for the reset! 🔔", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here! How can I help? ✨";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 Connection error. Try again in a second!", isError: true });
    }
}
