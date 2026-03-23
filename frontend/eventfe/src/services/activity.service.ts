import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/activities`;

export interface Activity {
  activityId: number;
  activityName: string;
  description: string | null;
  coverImage: string | null;
  location: string | null;
  activityType: string;
  teamMode: string;
  startTime: string | null;
  endTime: string | null;
  registrationDeadline: string | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  activityStatus: string;
  prize: string | null;
  organizationId: number;
  categoryId: number;
  registrationFormId: number | null;
  registrationForm?: { formId: number; title: string; status: string; description?: string | null } | null;
  organization?: { organizationId: number; organizationName: string; logoUrl: string | null };
  category?: { categoryId: number; categoryName: string };
  _count?: { registrations: number };
  activityTeamRule?: { minTeamMembers: number | null; maxTeamMembers: number | null } | null;
  activeCheckinSession?: {
    checkinId: number;
    checkInTime: string | null;
    checkInCloseTime: string | null;
    checkOutTime: string | null;
    checkOutCloseTime: string | null;
  } | null;
  hasCompletedCheckinSession?: boolean;
}

export interface ActivityCategory {
  categoryId: number;
  categoryName: string;
}

// Backend returns: { success: true, data: { data: [], meta: {} } }
export interface ActivitiesResponse {
  success: boolean;
  data: {
    data: Activity[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface ActivityResponse {
  success: boolean;
  data: Activity;
}

export interface CategoriesResponse {
  success: boolean;
  data: ActivityCategory[];
}

export async function getActivities({
  page = 1,
  limit = 8,
  type,
  status,
  categoryId,
  organizationId,
  startDate,
  endDate,
  search,
  token,
}: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  categoryId?: number;
  organizationId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  token?: string;
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type) params.set("activityType", type);
  if (status) params.set("activityStatus", status);
  if (categoryId) params.set("categoryId", String(categoryId));
  if (organizationId) params.set("organizationId", String(organizationId));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (search) params.set("search", search);
  return http.get<ActivitiesResponse>(`${BASE}?${params}`, token);
}

export async function getActivityById(id: number | string, token?: string) {
  return http.get<ActivityResponse>(`${BASE}/${id}`, token);
}

export async function getCategories(token?: string) {
  return http.get<CategoriesResponse>(`${BASE}/categories`, token);
}

export interface CreateActivityPayload {
  activityName: string;
  description?: string | null;
  coverImage?: string | null;
  location?: string | null;
  activityType: "program" | "competition";
  teamMode?: "individual" | "team" | "both";
  startTime?: string | null;
  endTime?: string | null;
  registrationDeadline?: string | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  prize?: string | null;
  organizationId: number;
  categoryId: number;
  registrationFormId?: number | null;
  teamRule?: { minTeamMembers?: number | null; maxTeamMembers?: number | null } | null;
}

export async function createActivity(data: CreateActivityPayload) {
  return http.post<ActivityResponse>(`${BASE}`, data);
}

export async function updateActivity(id: number | string, data: Partial<CreateActivityPayload>) {
  return http.put<ActivityResponse>(`${BASE}/${id}`, data);
}

export async function updateActivityStatus(id: number | string, activityStatus: string) {
  return http.put<ActivityResponse>(`${BASE}/${id}/status`, { activityStatus });
}

export interface CheckinSession {
  checkinId: number;
  activityId: number;
  checkInTime: string | null;
  checkInCloseTime: string | null;
  checkOutTime: string | null;
  checkOutCloseTime: string | null;
}

export async function openCheckinSession(
  activityId: number | string,
  params?: { checkInTime?: string | null; durationMinutes?: number | null }
) {
  return http.post<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/open`,
    params ?? {}
  );
}

export async function closeCheckinSession(activityId: number | string, checkinId: number) {
  return http.patch<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/${checkinId}/close-checkin`,
    {}
  );
}

export async function openCheckoutSession(
  activityId: number | string,
  checkinId: number,
  params?: { durationMinutes?: number | null }
) {
  return http.patch<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/${checkinId}/open-checkout`,
    params ?? {}
  );
}

export async function closeCheckoutSession(activityId: number | string, checkinId: number) {
  return http.patch<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/${checkinId}/close-checkout`,
    {}
  );
}

export async function extendCheckinSession(
  activityId: number | string,
  checkinId: number,
  minutes: number
) {
  return http.patch<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/${checkinId}/extend-checkin`,
    { minutes }
  );
}

export async function extendCheckoutSession(
  activityId: number | string,
  checkinId: number,
  minutes: number
) {
  return http.patch<{ success: boolean; data: CheckinSession }>(
    `${BASE}/${activityId}/checkin-sessions/${checkinId}/extend-checkout`,
    { minutes }
  );
}

export async function getMyOrgActivities({
  page = 1,
  limit = 10,
  status,
}: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("activityStatus", status);
  return http.get<ActivitiesResponse>(`${BASE}/my-org?${params}`);
}
