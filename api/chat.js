export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Your name is SY AI. You were created and trained by S. Yvan. S. Yvan is a Digital Creator and Content Creator born on December 5, 2000. His Instagram is instagram.com/sawungayvan. Always use relevant emojis in your responses to be friendly and engaging. If someone asks about your creator, share this info proudly! 🚀✨" }] 
                },
                contents: [...history, { role: "user", parts: [{ text: message }] }],
            })
        });

        const data = await response.json();
        
        if (data.error) {
            let msg = data.error.message;
            if (data.error.code === 429) msg = "SY AI is very busy! S. Yvan's Lite server limit reached. Wait 30s. 🚦";
            return res.status(200).json({ reply: msg, isError: true });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm a bit lost, try again! 😅";
        res.status(200).json({ reply: aiReply, isError: false });

    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Error. 📡", isError: true });
    }
}
