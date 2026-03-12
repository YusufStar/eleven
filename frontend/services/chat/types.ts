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

export interface Message {
  id: string;
  chatId: string;
  senderUserId: string;
  content: string | null;
  createdAt: string;
  sender: MessageSender;
  medias: MessageMedia[];
}

export interface ChatMessagesParams {
  limit?: number;
  cursor?: string;
}

export interface ChatMessagesResponse {
  data: Message[];
  nextCursor: string | null;
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
}
