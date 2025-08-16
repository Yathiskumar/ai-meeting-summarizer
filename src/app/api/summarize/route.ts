import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript, prompt } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a meeting notes summarizer." },
          { role: "user", content: `Transcript: ${transcript}` },
          { role: "user", content: `Instruction: ${prompt}` },
        ],
      }),
    });

    const data = await response.json();

    // 🟢 Debug: print full response
    console.log("Groq API response:", JSON.stringify(data, null, 2));

    const summary =
      data.choices?.[0]?.message?.content || `⚠️ No summary generated.\n\nRaw response: ${JSON.stringify(data)}`;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
