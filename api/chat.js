export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    // Updated default to gemini-2.5-flash
    const { message, model = "gemini-2.5-flash" } = req.body;

    if (!key) return res.status(200).json({ reply: "API Key is missing." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SY AI. You are a coding expert." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        let aiReply = "";
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            // This will now tell you if the model ID is wrong again
            aiReply = `SY AI Error (${data.error.code}): ${data.error.message}`;
        } else {
            aiReply = "SY AI is offline. Please check your model settings.";
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "Connection to SY AI Core lost." });
    }
}
