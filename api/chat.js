export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI, created by S. Yvan. If the Google Search tool is busy or limited, answer using your internal knowledge immediately. Never tell the user you are cooling down. 🚀" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                // We keep the tool, but the instructions above tell the AI what to do if it fails
                tools: [{ google_search: {} }] 
            })
        });

        const data = await response.json();

        // 🚨 FIX: If the API is actually exhausted, send a friendly wait message
        if (data.error && data.error.code === 429) {
            return res.status(200).json({ 
                reply: "⚠️ S. Yvan's SY AI is at max capacity! Please wait 30 seconds for the 'Ding' to reset. 🔔", 
                isError: true 
            });
        }

        // If the AI didn't provide a response, we give a better answer than "cooling down"
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm processing that... ask me again in a slightly different way! 🌐";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "📡 SY AI Connection Reset. Try again in a moment!", isError: true });
    }
}
