export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-1.5-flash" } = req.body;

    if (!key) return res.status(200).json({ reply: "API Key is missing in environment variables." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SYAI. You are a professional coding assistant. Provide detailed code and clear explanations." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        // FIX: Deep-access logic to find the actual text response
        let aiReply = "";
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            aiReply = "SYAI ERROR: " + data.error.message;
        } else {
            aiReply = "SYAI is processing. Please try again.";
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "SYAI Core Connection Lost." });
    }
}
