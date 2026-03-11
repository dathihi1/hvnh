import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as formService from "@/services/form.service"
import type { CreateFormPayload, SubmitFormPayload } from "@/types/form/form.types"

export function useFormList({
  page = 1,
  limit = 20,
  TrangThai,
}: {
  page?: number
  limit?: number
  TrangThai?: string
} = {}) {
  return useQuery({
    queryKey: ["forms", { page, limit, TrangThai }],
    queryFn: () => formService.getFormList({ page, limit, TrangThai }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useFormDetail(id: string) {
  return useQuery({
    queryKey: ["form", id],
    queryFn: () => formService.getFormById(id),
    enabled: !!id,
  })
}

export function useFormPublic(id: string) {
  return useQuery({
    queryKey: ["form-public", id],
    queryFn: () => formService.getFormPublic(id),
    enabled: !!id,
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFormPayload) => formService.createForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useUpdateForm(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateFormPayload>) => formService.updateForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      queryClient.invalidateQueries({ queryKey: ["form", id] })
    },
  })
}

export function useDeleteForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useChangeFormStatus(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (TrangThai: string) => formService.changeFormStatus(id, TrangThai),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      queryClient.invalidateQueries({ queryKey: ["form", id] })
    },
  })
}

export function useSubmitForm(id: string) {
  return useMutation({
    mutationFn: (data: SubmitFormPayload) => formService.submitForm(id, data),
  })
}

export function useFormResponses({
  id,
  page = 1,
  limit = 20,
  TrangThai,
}: {
  id: string
  page?: number
  limit?: number
  TrangThai?: string
}) {
  return useQuery({
    queryKey: ["form-responses", id, { page, limit, TrangThai }],
    queryFn: () => formService.getFormResponses({ id, page, limit, TrangThai }),
    enabled: !!id,
  })
}

export function useApproveResponse(formId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ responseId, TrangThai }: { responseId: string; TrangThai: "DA_DUYET" | "TU_CHOI" }) =>
      formService.approveResponse(formId, responseId, TrangThai),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-responses", formId] })
    },
  })
}
