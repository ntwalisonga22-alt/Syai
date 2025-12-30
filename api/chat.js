export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. If live search is unavailable, answer using your internal knowledge. Always be helpful! 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        // If Google says 'Resource Exhausted' (429), we send a friendly 'Wait' message
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ S. Yvan's server is catching its breath! Wait for the 'Ding' sound in 30s. 🔔", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble searching the web. Ask me something else! 🌐";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 SY AI is temporarily offline. Refresh the page!", isError: true });
    }
}
