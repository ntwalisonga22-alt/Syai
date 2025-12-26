export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, model = "gemini-3-flash", history = [] } = req.body;

    if (!key) return res.status(200).json({ reply: "API Key Missing." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SY AI. You have access to Google Search. You can generate code and answer any complex question." }] },
                // NEW: History allows SY AI to remember what you just said
                contents: [...history, { role: "user", parts: [{ text: message }] }],
                tools: [
                    { google_search: {} }, // ENABLES WEB SEARCH
                    { code_execution: {} } // ENABLES REAL-TIME CODING
                ]
            })
        });

        const data = await response.json();
        let aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "SY AI is having trouble thinking. Try again.";

        // Support for Grounding Metadata (Citations)
        if (data.candidates?.[0]?.groundingMetadata) {
            aiReply += "\n\n sources checked via Google Search.";
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "Core link broken." });
    }
}
