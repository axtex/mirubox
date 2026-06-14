"use client";

import { useState, useEffect, useRef } from "react";
import { X, Settings, Send, Lock } from "lucide-react";
import { CHARACTER_ROSTER, getCharacterById, getUnlockedCharacters } from "@/lib/characters";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CharacterChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("gojo");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [userXp, setUserXp] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedChar = localStorage.getItem("chatbot_char");
    if (savedChar) setSelectedCharId(savedChar);
  }, []);

  useEffect(() => {
    fetch("/api/user/xp")
      .then((r) => r.json())
      .then((data: { xp?: number }) => {
        if (typeof data.xp === "number") setUserXp(data.xp);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("chatbot_char", selectedCharId);
  }, [selectedCharId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const character = getCharacterById(selectedCharId) ?? CHARACTER_ROSTER[0];
  const unlocked = getUnlockedCharacters(userXp);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, characterId: selectedCharId, history: messages.slice(-10) }),
      });
      const data = await res.json() as { response?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
  }

  // Collapsed bubble — above mobile nav, beside corner on desktop
  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 flex items-center justify-center rounded-full text-2xl transition-all"
          style={{
            width: 56,
            height: 56,
            bottom: 80, // above mobile nav (64px + 16px)
            right: 16,
            background: character.accentColor,
            border: `2px solid ${character.accentColor}`,
            boxShadow: `0 4px 24px ${character.accentColor}4d`,
          }}
          aria-label={`Chat with ${character.name}`}
        >
          {character.avatarEmoji}
        </button>
        <style>{`
          @media (min-width: 768px) {
            .chatbot-btn { bottom: 24px !important; right: 24px !important; }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Chat panel */}
      <div
        className="fixed z-50 flex flex-col overflow-hidden
          inset-x-0 bottom-0 rounded-t-2xl
          md:inset-x-auto md:bottom-6 md:right-6 md:rounded-2xl"
        style={{
          height: "88dvh",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-bright)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Desktop size override */}
        <style>{`
          @media (min-width: 768px) {
            .chat-panel-override {
              height: 520px !important;
              width: 380px !important;
            }
          }
        `}</style>

        {/* Character accent line */}
        <div style={{ height: 2, background: character.accentColor, flexShrink: 0 }} />

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-2xl">{character.avatarEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{character.name}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{character.anime}</p>
          </div>
          <button
            onClick={() => setShowCharSelect((s) => !s)}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--fg-subtle)" }}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--fg-subtle)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Character select overlay */}
        {showCharSelect && (
          <div
            className="absolute inset-0 z-10 p-4 overflow-y-auto"
            style={{ background: "var(--bg-elevated)", top: 2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                Choose Character
              </h3>
              <button onClick={() => setShowCharSelect(false)} style={{ color: "var(--fg-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CHARACTER_ROSTER.map((char) => {
                const isUnlocked = unlocked.some((u) => u.id === char.id);
                const isActive = char.id === selectedCharId;
                return (
                  <button
                    key={char.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedCharId(char.id);
                        setShowCharSelect(false);
                        setMessages([]);
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                    style={{
                      background: isActive ? `${char.accentColor}22` : "var(--bg-card)",
                      border: `1px solid ${isActive ? char.accentColor : "var(--border)"}`,
                      opacity: isUnlocked ? 1 : 0.5,
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                    }}
                  >
                    <div className="relative inline-flex">
                      <span className="text-3xl">{char.avatarEmoji}</span>
                      {!isUnlocked && (
                        <Lock
                          className="absolute -bottom-1 -right-1 w-3 h-3"
                          style={{ color: "var(--fg-subtle)" }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: isUnlocked ? "var(--fg)" : "var(--fg-subtle)" }}>
                        {char.name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{char.anime}</p>
                      {!isUnlocked && (
                        <p className="text-[10px] mt-1" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                          Unlock at {char.xpRequired} XP
                        </p>
                      )}
                      {isActive && isUnlocked && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block"
                          style={{ background: char.accentColor, color: "#fff" }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <span className="text-5xl">{character.avatarEmoji}</span>
              <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}>
                {character.name}
              </p>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                {character.id === "gojo"
                  ? "Go ahead. Impress me with your question."
                  : "I have time. What would you like to know?"}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <span className="text-lg shrink-0 mt-0.5">{character.avatarEmoji}</span>
              )}
              <div
                className="max-w-[82%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? {
                        background: "var(--accent-muted)",
                        border: "1px solid var(--accent)",
                        borderRadius: "12px 12px 2px 12px",
                        color: "var(--fg)",
                      }
                    : {
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px 12px 12px 2px",
                        color: "var(--fg)",
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <span className="text-lg">{character.avatarEmoji}</span>
              <div
                className="px-4 py-3"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px 12px 12px 2px",
                }}
              >
                <div className="flex gap-1 items-center" style={{ height: 16 }}>
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: character.accentColor,
                        animation: `typingDot 1.2s ease-in-out ${j * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="shrink-0 flex items-end gap-2 px-3 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={character.placeholder}
            rows={1}
            className="flex-1 resize-none outline-none text-sm px-3 py-2 rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              maxHeight: 80,
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            className="shrink-0 p-2 rounded-lg transition-all"
            style={{
              background: isLoading || !input.trim() ? "var(--bg-card)" : character.accentColor,
              color: isLoading || !input.trim() ? "var(--fg-subtle)" : "#fff",
              border: "1px solid var(--border)",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
