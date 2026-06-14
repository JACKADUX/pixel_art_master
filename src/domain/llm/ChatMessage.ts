export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: number;
}

let messageIdCounter = 0;

export function createChatMessage(
  role: ChatMessageRole,
  content: string,
  id?: string,
): ChatMessage {
  messageIdCounter += 1;
  return {
    id: id ?? `msg-${Date.now()}-${messageIdCounter}`,
    role,
    content,
    createdAt: Date.now(),
  };
}

export function toApiMessages(
  messages: ChatMessage[],
): Array<{ role: ChatMessageRole; content: string }> {
  return messages.map(({ role, content }) => ({ role, content }));
}
