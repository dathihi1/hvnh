import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";

const USERS_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/users`;

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/organizations`;
const APPS_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/club-applications`;

export interface Organization {
  organizationId: number;
  organizationName: string;
  organizationType: string;
  email?: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  leftImageUrl: string | null;
  rightImageUrl: string | null;
  middleImageUrl: string | null;
  description: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  phoneNumber?: string | null;
  isRecruiting: boolean;
  applyDeadline: string | null;
  responseDeadline: string | null;
  interviewSchedule: string | null;
  recruitmentFormId: number | null;
  recruitmentForm?: { formId: number; title: string; status: string } | null;
}

export interface OrganizationMember {
  userId: number;
  organizationId: number;
  role: string | null;
  joinDate: string | null;
  user: {
    userId: number;
    userName: string;
    email: string;
    avatarUrl: string | null;
    studentId?: string | null;
    phoneNumber?: string | null;
    university?: string | null;
    className?: string | null;
    faculty?: string | null;
  };
}

// Backend returns: { success: true, data: { data: [], meta: {} } }
export interface OrganizationsResponse {
  success: boolean;
  data: {
    data: Organization[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface OrganizationResponse {
  success: boolean;
  data: Organization;
}

// Backend trả: { success: true, data: { data: OrganizationMember[], meta: {...} } }
export interface MembersResponse {
  success: boolean;
  data: {
    data: OrganizationMember[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface ClubApplication {
  applicationId: number;
  submittedAt: string;
  interviewTime: string | null;
  result: string;
  note: string | null;
  organizationId: number | null;
  activityId: number | null;
  userId: number;
  user?: { userId: number; userName: string; email: string; avatarUrl: string | null; studentId: string | null };
  organization?: { organizationId: number; organizationName: string } | null;
}

export interface ClubApplicationsResponse {
  success: boolean;
  data: {
    data: ClubApplication[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface ClubApplicationResponse {
  success: boolean;
  data: ClubApplication | null;
}

export async function getOrganizations({
  page = 1,
  limit = 10,
  type,
  isRecruiting,
  token,
}: {
  page?: number;
  limit?: number;
  type?: string;
  isRecruiting?: string;
  token?: string;
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type) params.set("organizationType", type);
  if (isRecruiting) params.set("isRecruiting", isRecruiting);
  return http.get<OrganizationsResponse>(`${BASE}?${params}`, token);
}

export async function getOrganizationById(id: number | string, token?: string) {
  return http.get<OrganizationResponse>(`${BASE}/${id}`, token);
}

export async function getOrganizationMembers(
  id: number | string,
  { page = 1, limit = 10, search }: { page?: number; limit?: number; search?: string } = {},
  token?: string,
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return http.get<MembersResponse>(`${BASE}/${id}/members?${params}`, token);
}

export async function removeMember(orgId: number | string, userId: number | string) {
  return http.delete<{ success: boolean; data: { message: string } }>(`${BASE}/${orgId}/members/${userId}`, undefined);
}

export async function addMember(orgId: number | string, userId: number, role: string = "member") {
  return http.post<{ success: boolean; data: OrganizationMember }>(`${BASE}/${orgId}/members`, { userId, role });
}

export async function notifyCandidates(
  orgId: number | string,
  data: { userIds: number[]; subject: string; message: string }
) {
  return http.post<{ success: boolean; data: { queued: number } }>(`${BASE}/${orgId}/notify-candidates`, data);
}

export interface MyOrganization extends Organization {
  memberRole: string;
  _count?: { organizationMembers: number; activities: number };
}

export interface MyOrganizationResponse {
  success: boolean;
  data: MyOrganization;
}

export interface OrgStats {
  activeActivities: number;
  totalRegistrations: number;
  newMembers: number;
}

export async function getMyOrganization() {
  return http.get<MyOrganizationResponse>(`${BASE}/my`);
}

export async function getOrgStats(id: number | string) {
  return http.get<{ success: boolean; data: OrgStats }>(`${BASE}/${id}/stats`);
}

export async function updateMyOrganization(id: number | string, data: Partial<Organization>) {
  return http.put<OrganizationResponse>(`${BASE}/${id}`, data);
}

export interface RecruitmentPayload {
  applyDeadline?: string | null;
  responseDeadline?: string | null;
  interviewSchedule?: string | null;
  recruitmentFormId?: number | null;
}

export async function openRecruitment(id: number | string, data: RecruitmentPayload) {
  return http.patch<OrganizationResponse>(`${BASE}/${id}/recruitment/open`, data);
}

export async function closeRecruitment(id: number | string) {
  return http.patch<OrganizationResponse>(`${BASE}/${id}/recruitment/close`, {});
}

export async function updateRecruitment(id: number | string, data: RecruitmentPayload) {
  return http.put<OrganizationResponse>(`${BASE}/${id}/recruitment`, data);
}

// ─── Club Applications ───────────────────────────────────────────────────────

export async function applyToOrg(orgId: number | string, data: { note?: string }) {
  return http.post<ClubApplicationResponse>(`${APPS_BASE}/org/${orgId}`, data);
}

export async function getMyOrgApplication(orgId: number | string) {
  return http.get<ClubApplicationResponse>(`${APPS_BASE}/org/${orgId}/my`);
}

export async function getOrgApplications(
  orgId: number | string,
  { page = 1, limit = 20, result, search }: { page?: number; limit?: number; result?: string; search?: string } = {}
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (result) params.set("result", result);
  if (search) params.set("search", search);
  return http.get<ClubApplicationsResponse>(`${APPS_BASE}/org/${orgId}?${params}`);
}

export async function updateClubApplication(
  applicationId: number | string,
  data: { result: string; interviewTime?: string | null; note?: string | null }
) {
  return http.put<ClubApplicationResponse>(`${APPS_BASE}/${applicationId}`, data);
}

export interface LookupUser {
  userId: number;
  userName: string;
  email: string;
  studentId: string | null;
  avatarUrl: string | null;
  university: string;
  faculty: string | null;
}

export async function lookupUserByEmail(email: string) {
  return http.get<{ success: boolean; data: LookupUser | null }>(`${USERS_BASE}/lookup?email=${encodeURIComponent(email)}`);
}

// ─── Organization Groups ─────────────────────────────────────────────────────

export interface OrgGroup {
  groupId: number;
  organizationId: number;
  groupName: string;
  description: string | null;
  createdAt: string;
  _count?: { members: number };
  members?: OrganizationMember[];
}

export interface MembersWithGroupsResponse {
  grouped: OrgGroup[];
  ungrouped: OrganizationMember[];
}

export async function getAllMembersWithGroups(orgId: number | string) {
  return http.get<{ success: boolean; data: MembersWithGroupsResponse }>(`${BASE}/${orgId}/members/all`);
}

export async function getGroups(orgId: number | string) {
  return http.get<{ success: boolean; data: OrgGroup[] }>(`${BASE}/${orgId}/groups`);
}

export async function createGroup(orgId: number | string, data: { groupName: string; description?: string }) {
  return http.post<{ success: boolean; data: OrgGroup }>(`${BASE}/${orgId}/groups`, data);
}

export async function pushToGroup(
  orgId: number | string,
  data: { memberIds: number[]; groupId?: number; newGroupName?: string }
) {
  return http.post<{ success: boolean; data: { groupId: number; groupName: string; assignedCount: number } }>(
    `${BASE}/${orgId}/push-to-group`,
    data
  );
}

export async function deleteGroup(orgId: number | string, groupId: number | string) {
  return http.delete<{ success: boolean }>(`${BASE}/${orgId}/groups/${groupId}`, undefined);
}
