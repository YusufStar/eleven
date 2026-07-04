export type ChatType = "ORG" | "DM";

export interface Chat {
  id: string;
  type: ChatType;
  organizationId: string | null;
  participant1Id: string | null;
  participant2Id: string | null;
  createdAt: string;
}

export interface MessageSender {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface MessageMedia {
  id: string;
  messageId: string;
  url: string;
  mimetype: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  user?: { name: string } | null;
}

export interface MessageReplyPreview {
  id: string;
  content: string | null;
  senderUserId: string;
  sender?: { id: string; name: string } | null;
}

export interface Message {
  id: string;
  chatId: string;
  senderUserId: string;
  content: string | null;
  createdAt: string;
  editedAt: string | null;
  pinnedAt: string | null;
  replyToId: string | null;
  replyTo?: MessageReplyPreview | null;
  mentionUserIds: string[];
  reactions: MessageReaction[];
  sender: MessageSender;
  medias: MessageMedia[];
  _count?: { replies: number };
}

export interface ChatMessagesParams {
  limit?: number;
  cursor?: string;
  after?: string;
}

export interface ChatMessagesResponse {
  data: Message[];
  nextCursor: string | null;
}

export interface ChatRead {
  id: string;
  chatId: string;
  userId: string;
  lastReadAt: string;
  user: { id: string; name: string; image: string | null };
}

export interface TypingUser {
  userId: string;
  name: string;
}

/** Media item from upload response; backend accepts this or { url, mimetype, size }. */
export interface SendMessageMediaUpload {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface SendMessageMediaStandard {
  url: string;
  mimetype: string;
  size: number;
}

export type SendMessageMediaItem = SendMessageMediaUpload | SendMessageMediaStandard;

export interface SendMessagePayload {
  content?: string | null;
  medias?: SendMessageMediaItem[];
  replyToId?: string | null;
  mentionUserIds?: string[];
}
