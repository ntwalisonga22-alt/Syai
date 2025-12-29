export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        // We use Gemini 1.5 Flash - it's faster and more stable for free users
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. You are a helpful school assistant. Use live search ONLY if necessary for current events." }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                // Safety: We keep the tool, but the backend now handles the "429 Busy" error better
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        // 🚨 FIX: Detect if the API is "Busy" or "Limit Reached"
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ S. Yvan's SY AI is at max capacity! Please wait 60 seconds for the 'Ding' to reset your API. 🔔", 
                isError: true 
            });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm thinking... try asking that again in a simpler way! 🌐";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 SY AI Connection Glitch. Refresh the page!", isError: true });
    }
}
