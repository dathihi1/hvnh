import { envConfig } from "@/configs/env.config"
import { http } from "@/configs/http.comfig"
import type {
  CreateFormPayload,
  FormDetailResponse,
  FormListResponse,
  ResponseListResponse,
  SubmitFormPayload,
} from "@/types/form/form.types"

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/mau-form`

export async function getFormList({
  page = 1,
  limit = 20,
  TrangThai,
  token,
}: {
  page?: number
  limit?: number
  TrangThai?: string
  token?: string
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (TrangThai) params.set("TrangThai", TrangThai)
  return http.get<FormListResponse>(`${BASE}?${params}`, token)
}

export async function getFormById(id: string, token?: string) {
  return http.get<FormDetailResponse>(`${BASE}/${id}`, token)
}

export async function getFormPublic(id: string, token?: string) {
  return http.get<FormDetailResponse>(`${BASE}/${id}/public`, token)
}

export async function createForm(data: CreateFormPayload, token?: string) {
  return http.post<FormDetailResponse>(`${BASE}`, data, token)
}

export async function updateForm(id: string, data: Partial<CreateFormPayload>, token?: string) {
  return http.put<FormDetailResponse>(`${BASE}/${id}`, data, token)
}

export async function deleteForm(id: string, token?: string) {
  return http.delete<{ success: boolean }>(`${BASE}/${id}`, undefined, token)
}

export async function changeFormStatus(id: string, TrangThai: string, token?: string) {
  return http.put<FormDetailResponse>(`${BASE}/${id}/trang-thai`, { TrangThai }, token)
}

export async function submitForm(id: string, data: SubmitFormPayload, token?: string) {
  return http.post<{ success: boolean }>(`${BASE}/${id}/nop`, data, token)
}

export async function getFormResponses({
  id,
  page = 1,
  limit = 20,
  TrangThai,
  token,
}: {
  id: string
  page?: number
  limit?: number
  TrangThai?: string
  token?: string
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (TrangThai) params.set("TrangThai", TrangThai)
  return http.get<ResponseListResponse>(`${BASE}/${id}/phan-hoi?${params}`, token)
}

export async function approveResponse(
  formId: string,
  responseId: string,
  TrangThai: "DA_DUYET" | "TU_CHOI",
  token?: string
) {
  return http.put(`${BASE}/${formId}/phan-hoi/${responseId}/duyet`, { TrangThai }, token)
}

export async function exportGoogleSheets(id: string, token?: string) {
  return http.post<{ success: boolean; data: { spreadsheetUrl: string } }>(
    `${BASE}/${id}/export/google-sheets`,
    {},
    token
  )
}
