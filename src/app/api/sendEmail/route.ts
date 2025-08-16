import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// 🟢 Server-side validation
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { recipients, summary } = await req.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients provided." }, { status: 400 });
    }

    const invalidEmails = recipients.filter((e: string) => !validateEmail(e));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid emails: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: "AI Meeting Summary",
      text: summary,
    });

    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
