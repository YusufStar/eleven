export interface MeetingUser {
  id: string;
  name: string;
  image: string | null;
}

export interface MeetingParticipant {
  id: string;
  memberId: string;
  member: { id: string; user: MeetingUser };
}

export interface Meeting {
  id: string;
  code: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  isPublic: boolean;
  createdById: string;
  createdBy: { id: string; user: MeetingUser };
  participants: MeetingParticipant[];
  createdAt: string;
}

export interface CreateMeetingPayload {
  title?: string;
  startsAt?: string | null;
  isPublic?: boolean;
  participantMemberIds?: string[];
}
