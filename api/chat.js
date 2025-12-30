export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. You have live web access. Be friendly and helpful to S. Yvan's classmates." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        // Detect Rate Limit (Error 429)
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ S. Yvan's SY AI is at its limit! Wait 30s for the API to cool down.", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't find an answer on the web. Try asking again differently!";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 SY AI is having a glitch. Refresh the page!", isError: true });
    }
}
