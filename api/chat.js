export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-1.5-flash" } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SYAI. You are a world-class coding expert. Provide full code and clear explanations." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        // REPAIR: Drills through candidates, content, and parts to find the ACTUAL text
        let aiReply = "SYAI is unable to process this request.";
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            aiReply = "SYAI Error: " + data.error.message;
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "Connection to SYAI Core lost." });
    }
}
