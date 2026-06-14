import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { getCharacterById, isCharacterUnlocked } from "@/lib/characters";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

const messageCount = new Map<string, { count: number; date: string }>();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { message?: string; characterId?: string; history?: ChatMessage[] };
  const { message, characterId = "gojo", history = [] } = body;

  if (!message?.trim()) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  // Rate limit: 50 messages per user per day
  const today = new Date().toDateString();
  const userLimit = messageCount.get(session.user.id);
  if (userLimit?.date === today && userLimit.count >= 50) {
    return Response.json({ error: "Daily message limit reached" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true },
  });

  if (!isCharacterUnlocked(characterId, user?.xp ?? 0)) {
    return Response.json({ error: "Character not unlocked" }, { status: 403 });
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: character.systemPrompt,
    messages: [
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ],
  });

  // Update rate limit
  const current = messageCount.get(session.user.id);
  if (current?.date === today) {
    messageCount.set(session.user.id, { count: current.count + 1, date: today });
  } else {
    messageCount.set(session.user.id, { count: 1, date: today });
  }

  const reply =
    response.content[0].type === "text"
      ? response.content[0].text
      : "I have nothing to say about that.";

  return Response.json({ response: reply, characterId });
}
