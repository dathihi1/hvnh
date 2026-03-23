import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/registrations`;
const USERS_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/users`;

export interface UserPreview {
  userId: number;
  userName: string;
  email: string;
  studentId: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  university: string;
}

export async function lookupUserByEmail(email: string) {
  return http.get<{ success: boolean; data: UserPreview | null }>(
    `${USERS_BASE}/lookup?email=${encodeURIComponent(email)}`
  );
}

export interface Registration {
  registrationId: number;
  status: string;
  registrationType: string;
  registrationTime: string;
  activityId: number;
  userId: number;
  activity?: {
    activityId: number;
    activityName: string;
    startTime: string | null;
    endTime: string | null;
    coverImage: string | null;
    activityStatus: string;
  };
}

export interface RegistrationsResponse {
  success: boolean;
  data: Registration[];
  meta: { total: number; page: number; limit: number };
}

export async function createRegistration(
  data: {
    activityId: number;
    registrationType?: string;
    teamName?: string;
    teamMembers?: { userId: number; role: string }[];
  },
  token?: string
) {
  return http.post<{ success: boolean; data: Registration }>(
    BASE,
    { registrationType: "individual", ...data },
    token
  );
}

export async function getMyRegistrations(token?: string) {
  return http.get<RegistrationsResponse>(`${BASE}/my`, token);
}

export interface MyActivityRegistration {
  registrationId: number;
  status: string; // pending | approved | rejected | cancelled | waiting
  registrationTime: string;
  activityId: number;
  registrationCheckins: {
    checkinId: number;
    checkInTime: string | null;
    checkOutTime: string | null;
    activityCheckin: { checkinId: number; checkInTime: string | null; checkOutTime: string | null } | null;
  }[];
}

export async function getMyRegistrationByActivity(activityId: number | string, token?: string) {
  return http.get<{ success: boolean; data: MyActivityRegistration | null }>(
    `${BASE}/my/activity/${activityId}`,
    token
  );
}

export async function cancelRegistration(id: number, token?: string) {
  return http.put<{ success: boolean }>(`${BASE}/${id}/cancel`, {}, token);
}

export interface RegistrationDetail {
  registrationId: number;
  status: string;
  registrationType: string;
  registrationTime: string;
  activityId: number;
  userId: number;
  user?: {
    userId: number;
    userName: string;
    email: string;
    studentId: string | null;
    avatarUrl: string | null;
  };
  teamName?: string;
  teamMembers?: { registrationId: number; userId: number; role: string; user: { userId: number; userName: string } }[];
}

export interface ActivityStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  waiting: number;
  checkedIn: number;
  checkedOut: number;
  maxParticipants: number | null;
}

export interface RegistrationDetailExtended extends RegistrationDetail {
  user?: RegistrationDetail["user"] & {
    phoneNumber: string | null;
    university: string | null;
    faculty: string | null;
    className: string | null;
  };
  registrationCheckins?: { checkInTime: string | null; checkOutTime: string | null }[];
}

export async function getRegistrationsByActivity(
  activityId: number | string,
  params?: { page?: number; limit?: number; status?: string; search?: string; checkinStatus?: string; registrationType?: string },
  token?: string
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.checkinStatus) qs.set("checkinStatus", params.checkinStatus);
  if (params?.registrationType) qs.set("registrationType", params.registrationType);
  const qstr = qs.toString() ? `?${qs}` : "";
  return http.get<{
    success: boolean;
    data: { data: RegistrationDetailExtended[]; meta: { total: number; page: number; limit: number; totalPages: number } };
  }>(`${BASE}/activity/${activityId}${qstr}`, token);
}

export async function getActivityStats(activityId: number | string, token?: string) {
  return http.get<{ success: boolean; data: ActivityStats }>(`${BASE}/activity/${activityId}/stats`, token);
}

export async function updateRegistrationStatus(
  id: number,
  status: "approved" | "rejected" | "pending",
  token?: string
) {
  return http.put<{ success: boolean }>(`${BASE}/${id}/status`, { status }, token);
}

export async function bulkUpdateRegistrationStatus(
  registrationIds: number[],
  status: "approved" | "rejected",
  token?: string
) {
  return http.put<{ success: boolean; data: { updated: number } }>(
    `${BASE}/bulk-status`,
    { registrationIds, status },
    token
  );
}

export async function matchTeam(
  data: {
    activityId: number;
    teamName: string;
    leaderRegistrationId: number;
    memberRegistrationIds: number[];
  },
  token?: string
) {
  return http.post<{ success: boolean; teamName: string }>(
    `${BASE}/match-team`,
    data,
    token
  );
}
