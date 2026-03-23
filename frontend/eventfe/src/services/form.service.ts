import { envConfig } from "@/configs/env.config"
import { http } from "@/configs/http.comfig"
import type {
  CreateFormPayload,
  ApiResponse,
  PaginatedData,
  Form,
  FormResponse,
  SubmitFormPayload,
} from "@/types/form/form.types"

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/forms`

export async function getFormList({
  page = 1,
  limit = 20,
  status,
  organizationId,
  search,
  token,
}: {
  page?: number
  limit?: number
  status?: string
  organizationId?: number
  search?: string
  token?: string
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  if (organizationId) params.set("organizationId", String(organizationId))
  if (search) params.set("search", search)
  return http.get<ApiResponse<PaginatedData<Form>>>(`${BASE}?${params}`, token)
}

export async function getFormById(id: string | number, token?: string) {
  return http.get<ApiResponse<Form>>(`${BASE}/${id}`, token)
}

export async function getFormPublic(id: string | number, token?: string) {
  return http.get<ApiResponse<Form>>(`${BASE}/${id}/public`, token)
}

export async function createForm(data: CreateFormPayload, token?: string) {
  return http.post<ApiResponse<Form>>(`${BASE}`, data, token)
}

export async function updateForm(id: string | number, data: Partial<CreateFormPayload>, token?: string) {
  return http.put<ApiResponse<Form>>(`${BASE}/${id}`, data, token)
}

export async function deleteForm(id: string | number, token?: string) {
  return http.delete<ApiResponse<{ message: string }>>(`${BASE}/${id}`, undefined, token)
}

export async function changeFormStatus(id: string | number, status: string, token?: string) {
  return http.put<ApiResponse<Form>>(`${BASE}/${id}/status`, { status }, token)
}

export async function submitForm(id: string | number, data: SubmitFormPayload, token?: string) {
  return http.post<ApiResponse<FormResponse>>(`${BASE}/${id}/submit`, data, token)
}

export async function getFormResponses({
  id,
  page = 1,
  limit = 20,
  status,
  userId,
  search,
  token,
}: {
  id: string | number
  page?: number
  limit?: number
  status?: string
  userId?: number
  search?: string
  token?: string
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  if (userId) params.set("userId", String(userId))
  if (search) params.set("search", search)
  return http.get<ApiResponse<PaginatedData<FormResponse>>>(`${BASE}/${id}/responses?${params}`, token)
}

export async function approveResponse(
  formId: string | number,
  responseId: string | number,
  status: "approved" | "rejected",
  token?: string
) {
  return http.put<ApiResponse<FormResponse>>(
    `${BASE}/${formId}/responses/${responseId}/approve`,
    { status },
    token
  )
}

export async function exportGoogleSheets(id: string | number, token?: string) {
  return http.post<ApiResponse<{ spreadsheetUrl: string }>>(
    `${BASE}/${id}/export/google-sheets`,
    {},
    token
  )
}

export async function getMyFormResponse(id: string | number, token?: string) {
  return http.get<ApiResponse<FormResponse | null>>(`${BASE}/${id}/my-response`, token)
}

export async function acceptFormRespondents(orgId: number | string, userIds: number[]) {
  const APPS_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/club-applications`
  return http.post<ApiResponse<{ userId: number; status: string; applicationId: number }[]>>(
    `${APPS_BASE}/org/${orgId}/accept`,
    { userIds }
  )
}
