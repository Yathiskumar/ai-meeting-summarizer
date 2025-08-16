"use client";

import { useState } from "react";
import mammoth from "mammoth";
import toast, { Toaster } from "react-hot-toast";


export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [fileName, setFileName] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => setTranscript(event.target?.result as string);
      reader.readAsText(file);
    }  else if (ext === "docx") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTranscript(result.value);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Unsupported file type. Please upload .txt, .pdf, or .docx");
    }
  };

  const handleGenerateSummary = async () => {
    if (!transcript || !prompt) {
      toast.error("Please upload a transcript and enter an instruction.");
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        toast.error(data.error || "Failed to generate summary.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error generating summary.");
    }

    setLoading(false);
  };

  const handleAddRecipient = () => setRecipients([...recipients, ""]);
  const handleRemoveRecipient = (i: number) =>
    setRecipients(recipients.filter((_, idx) => idx !== i));
  const handleRecipientChange = (i: number, val: string) => {
    const updated = [...recipients];
    updated[i] = val;
    setRecipients(updated);
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0 || !summary) {
      toast.error("Please add at least one recipient and generate summary first.");
      return;
    }

    const invalidEmails = recipients.filter((e) => !validateEmail(e));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email(s): ${invalidEmails.join(", ")}`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, summary }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Email sent successfully!");
        setRecipients([]);
      } else {
        toast.error(data.error || "Failed to send email.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error sending email.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-6">
      <Toaster position="bottom-right" />

      <div className="w-full max-w-2xl bg-white shadow-md rounded-2xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          AI Meeting Notes Summarizer
        </h1>

        {/* Upload transcript */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Upload Transcript (.txt, .docx)
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            {fileName ? (
              <span className="text-gray-700 text-sm truncate max-w-[200px]">
                {fileName}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">No file chosen</span>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Transcript
          </label>
          <textarea
            className="w-full h-48 p-3 border text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcript will appear here..."
          />
        </div>

        {/* Custom Prompt Input */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Custom Instruction
          </label>
          <input
            type="text"
            className="w-full p-3 text-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleGenerateSummary();
              }
            }}
            placeholder="e.g., Summarize in bullet points for executives"
          />
        </div>

        {/* Generate Summary */}
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>

        {/* Show Summary */}
        {summary && (
          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Generated Summary
              </h2>
              <textarea
                className="w-full h-48 p-3 border text-gray-700 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            {/* Dynamic Recipients */}
            <div className="space-y-2">
              <h3 className="text-md font-medium text-gray-700">Recipients</h3>
              {recipients.map((email, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="email"
                    className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                      validateEmail(email) || email === ""
                        ? "text-gray-700 border-gray-300 focus:ring-green-400"
                        : "text-gray-700 border-red-500 focus:ring-red-400"
                    }`}
                    value={email}
                    onChange={(e) => handleRecipientChange(i, e.target.value)}
                    placeholder="Recipient email"
                  />
                  <button
                    onClick={() => handleRemoveRecipient(i)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddRecipient}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                + Add Recipient
              </button>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {sending ? "Sending..." : "Send via Email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
