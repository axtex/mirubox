"use client";

import { useState } from "react";

const CONTACT_EMAIL = "hello@mirubox.app";

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "#5a5a65",
  textTransform: "uppercase",
  marginBottom: 8,
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "#1b1b1e",
  border: "1px solid #2a2a2d",
  borderRadius: 2,
  padding: "8px 12px",
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "#e4e1e6",
  outline: "none",
};

function Divider() {
  return <div style={{ height: 1, background: "#1f1f22", margin: "28px 0" }} />;
}

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = `${message}${email ? `\n\n— ${email}` : ""}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject || "mirubox feedback"
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <div style={{ background: "#0f0f12", minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 0" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 13, fontWeight: 600, color: "#e4e1e6", marginBottom: 4 }}>
          CONTACT
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#9e9ea8", lineHeight: 1.7, marginBottom: 32 }}>
          Found a bug, have a suggestion, or just want to say something? We&apos;d love to hear it.
          We aim to read all messages. We can&apos;t always reply individually but feedback shapes
          what gets built next.
        </p>

        <Divider />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ ...HEADING_STYLE, marginBottom: 6 }}>SUBJECT</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Bug report, feature request, other..."
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={{ ...HEADING_STYLE, marginBottom: 6 }}>MESSAGE</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              required
              style={{ ...INPUT_STYLE, minHeight: 120, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ ...HEADING_STYLE, marginBottom: 6 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com (optional)"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary"
              style={{ minHeight: 32, padding: "6px 14px", fontSize: 10 }}
            >
              SEND
            </button>
          </div>
        </form>

        <Divider />

        <p style={HEADING_STYLE}>FOR LEGAL ENQUIRIES</p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#9e9ea8", lineHeight: 1.7 }}>
          Use the contact form above and mark the subject as Legal.
        </p>
      </div>
    </div>
  );
}
