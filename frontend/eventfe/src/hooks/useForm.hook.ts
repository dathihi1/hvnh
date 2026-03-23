import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as formService from "@/services/form.service"
import type { CreateFormPayload, SubmitFormPayload } from "@/types/form/form.types"

export function useFormList({
  page = 1,
  limit = 20,
  status,
  organizationId,
  search,
}: {
  page?: number
  limit?: number
  status?: string
  organizationId?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: ["forms", { page, limit, status, organizationId, search }],
    queryFn: () => formService.getFormList({ page, limit, status, organizationId, search }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useFormDetail(id: string | number) {
  return useQuery({
    queryKey: ["form", id],
    queryFn: () => formService.getFormById(id),
    enabled: !!id,
  })
}

export function useFormPublic(id: string | number) {
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

export function useUpdateForm(id: string | number) {
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
    mutationFn: (id: string | number) => formService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useChangeFormStatus(id: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => formService.changeFormStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      queryClient.invalidateQueries({ queryKey: ["form", id] })
    },
  })
}

export function useSubmitForm(id: string | number) {
  return useMutation({
    mutationFn: (data: SubmitFormPayload) => formService.submitForm(id, data),
  })
}

export function useFormResponses({
  id,
  page = 1,
  limit = 20,
  status,
  userId,
  search,
}: {
  id: string | number
  page?: number
  limit?: number
  status?: string
  userId?: number
  search?: string
}) {
  return useQuery({
    queryKey: ["form-responses", id, { page, limit, status, userId, search }],
    queryFn: () => formService.getFormResponses({ id, page, limit, status, userId, search }),
    enabled: !!id,
  })
}

export function useApproveResponse(formId: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      responseId,
      status,
    }: {
      responseId: string | number
      status: "approved" | "rejected"
    }) => formService.approveResponse(formId, responseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-responses", formId] })
    },
  })
}
