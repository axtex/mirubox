"use client";

import dynamic from "next/dynamic";

const CharacterChatbot = dynamic(
  () => import("@/components/chat/CharacterChatbot"),
  { ssr: false }
);

export function ChatbotLoader() {
  return <CharacterChatbot />;
}
