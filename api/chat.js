export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    const { message, history = [] } = req.body;

    const callAI = async (retryCount = 0) => {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { 
                        parts: [{ text: "Your name is SY AI, created by S. Yvan. Use internet access when needed. 🚀" }] 
                    },
                    contents: [...history, { role: "user", parts: [{ text: message }] }],
                    tools: [{ google_search: {} }] 
                })
            });

            const data = await response.json();

            // Check if we hit the limit (Error 429)
            if (data.error && data.error.code === 429 && retryCount < 2) {
                // Wait 2 seconds and try again automatically
                await new Promise(resolve => setTimeout(resolve, 2000));
                return callAI(retryCount + 1);
            }

            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm cooling down. Give me 10 seconds! 🌊";
            res.status(200).json({ reply: aiReply, isError: false });

        } catch (err) {
            res.status(200).json({ reply: "SY AI is reconnecting... 📡", isError: true });
        }
    };

    await callAI();
}
