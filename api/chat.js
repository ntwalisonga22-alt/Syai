export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-2.5-flash", history = [] } = req.body;

    if (!key) return res.status(200).json({ reply: "API Key Missing." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Keeps SY AI's personality consistent
                system_instruction: { parts: [{ text: "Your name is SY AI. You are a helpful assistant with web search and coding expertise." }] },
                // Sends history so it remembers previous messages
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [{ google_search: {} }] // ENABLES WEB SEARCH
            })
        });

        const data = await response.json();
        let aiReply = "SY AI Error: Could not process request.";

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            aiReply = `SY AI ERROR: ${data.error.message}`;
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "SY AI Connection Lost." });
    }
}
