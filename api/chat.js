export default async function handler(req, res) {
    const key = process.env.GEMINI_API_KEY;
    // Updated default to Gemini 2.5 Flash (Stable)
    const { message, model = "gemini-2.5-flash", checkStatus = false } = req.body;

    if (!key) return res.status(200).json({ reply: "SY AI Error: API Key is missing." });

    // --- HEALTH CHECK FEATURE ---
    if (checkStatus) {
        try {
            const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const testData = await testRes.json();
            if (testData.models) return res.status(200).json({ status: "Online", count: testData.models.length });
            return res.status(200).json({ status: "Offline", message: testData.error?.message || "Invalid Key" });
        } catch (e) { return res.status(200).json({ status: "Error" }); }
    }

    // --- MAIN CHAT LOGIC ---
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "Your name is SY AI. You provide clean, updated code and expert explanations." }] },
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        // Fix: Explicitly drill down into the response to avoid the "Ready" bug
        let aiReply = "SY AI: Error processing response.";
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            aiReply = `SY AI ERROR (${data.error.code}): ${data.error.message}`;
        }

        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(200).json({ reply: "SY AI: Lost connection to Core." });
    }
}
