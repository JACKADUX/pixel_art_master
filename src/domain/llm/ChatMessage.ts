export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatTextPart {
  type: "text";
  text: string;
}

export interface ChatImagePart {
  type: "image_url";
  image_url: { url: string };
}

export type ChatContentPart = ChatTextPart | ChatImagePart;

/** OpenAI 兼容的消息内容：纯文本或多模态分块数组 */
export type ChatApiContent = string | ChatContentPart[];

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  /** 可选的图片（data URL），用于多模态（识图）请求 */
  images?: string[];
  createdAt: number;
}

let messageIdCounter = 0;

export function createChatMessage(
  role: ChatMessageRole,
  content: string,
  options?: { id?: string; images?: string[] },
): ChatMessage {
  messageIdCounter += 1;
  const images = options?.images?.length ? options.images : undefined;
  return {
    id: options?.id ?? `msg-${Date.now()}-${messageIdCounter}`,
    role,
    content,
    ...(images ? { images } : {}),
    createdAt: Date.now(),
  };
}

function toApiContent(message: ChatMessage): ChatApiContent {
  if (!message.images?.length) {
    return message.content;
  }
  const parts: ChatContentPart[] = [];
  if (message.content.trim()) {
    parts.push({ type: "text", text: message.content });
  }
  for (const url of message.images) {
    parts.push({ type: "image_url", image_url: { url } });
  }
  return parts;
}

export function toApiMessages(
  messages: ChatMessage[],
): Array<{ role: ChatMessageRole; content: ChatApiContent }> {
  return messages.map((message) => ({
    role: message.role,
    content: toApiContent(message),
  }));
}
