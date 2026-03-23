"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useFormDetail, useFormResponses } from "@/hooks/useForm.hook"
import { useDebounce } from "@/hooks/useDebounce"
import { acceptFormRespondents } from "@/services/form.service"
import { getMyOrganization } from "@/services/organization.service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconArrowLeft, IconSearch, IconUserCheck, IconEye } from "@tabler/icons-react"
import { toastSuccess, toastError } from "@/lib/toast"
import type { Form, FormResponse, Question } from "@/types/form/form.types"

// Flatten all questions from all sections in display order
function flattenQuestions(form: Form): Question[] {
  return [...form.sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) => [...s.questions].sort((a, b) => a.order - b.order))
}

// Get display value for a single answer cell
function getAnswerDisplay(response: FormResponse, questionId: number): string {
  const answer = response.answers.find((a) => a.question.questionId === questionId)
  if (!answer) return "—"
  if (answer.answerOptions.length > 0) {
    return answer.answerOptions
      .map((ao) => {
        if (ao.row) return `${ao.row.label}: ${ao.option?.label ?? ao.otherText ?? ""}`
        return ao.option?.label ?? ao.otherText ?? ""
      })
      .filter(Boolean)
      .join(", ")
  }
  return answer.textValue?.trim() || "—"
}

export default function OrgFormResponsesPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [viewResponse, setViewResponse] = React.useState<FormResponse | null>(null)
  // Track accepted userIds (persisted across pagination)
  const [acceptedUserIds, setAcceptedUserIds] = React.useState<Set<number>>(new Set())

  const debouncedSearch = useDebounce(search, 400)

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: getMyOrganization,
  })
  const orgId = orgData?.data?.organizationId

  const { data: formResult } = useFormDetail(params.id)
  const { data: responsesResult, isLoading } = useFormResponses({
    id: params.id,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  })

  const form = formResult?.data
  const responses: FormResponse[] = responsesResult?.data?.data ?? []
  const meta = responsesResult?.data?.meta

  const questions = React.useMemo(
    () => (form ? flattenQuestions(form) : []),
    [form]
  )

  const acceptMut = useMutation({
    mutationFn: (userIds: number[]) => acceptFormRespondents(orgId!, userIds),
    onSuccess: (_, userIds) => {
      toastSuccess(`Đã chấp nhận ${userIds.length} ứng viên`)
      setAcceptedUserIds((prev) => {
        const next = new Set(prev)
        userIds.forEach((id) => next.add(id))
        return next
      })
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ["org-candidates", orgId] })
    },
    onError: () => toastError("Chấp nhận thất bại"),
  })

  const handleToggle = (responseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(responseId)) next.delete(responseId)
      else next.add(responseId)
      return next
    })
  }

  const handleToggleAll = () => {
    const eligible = responses.filter((r) => r.userId && !acceptedUserIds.has(r.userId))
    if (selectedIds.size === eligible.length && eligible.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(eligible.map((r) => r.responseId)))
    }
  }

  const handleAcceptSelected = () => {
    const userIds = responses
      .filter((r) => selectedIds.has(r.responseId) && r.userId)
      .map((r) => r.userId!)
    if (userIds.length === 0) return
    acceptMut.mutate(userIds)
  }

  const handleAcceptOne = (r: FormResponse) => {
    if (!r.userId) return
    acceptMut.mutate([r.userId])
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    setSelectedIds(new Set())
  }

  const eligibleCount = responses.filter((r) => r.userId && !acceptedUserIds.has(r.userId)).length
  const allEligibleSelected =
    eligibleCount > 0 && selectedIds.size === eligibleCount

  return (
    <div className="px-[60px] py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/organization/forms">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0E5C63]">PHẢN HỒI BIỂU MẪU</h1>
            {form && <p className="text-sm text-muted-foreground">{form.title}</p>}
          </div>
        </div>
        {meta && (
          <span className="text-sm text-muted-foreground">{meta.total} phản hồi</span>
        )}
      </div>

      {/* Search + filter + bulk actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#0E5C63]/30"
          />
        </div>

        {selectedIds.size > 0 && (
          <Button
            size="sm"
            className="bg-[#0E5C63] hover:bg-[#0a4a50]"
            disabled={acceptMut.isPending}
            onClick={handleAcceptSelected}
          >
            <IconUserCheck className="size-4 mr-1" />
            Chấp nhận {selectedIds.size} đã chọn
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-[#0E5C63] text-white">
              <th className="px-3 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={handleToggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Người nộp</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Email</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Thời gian</th>
              {questions.map((q) => (
                <th key={q.questionId} className="px-3 py-3 text-left max-w-[200px]">
                  <div className="truncate max-w-[180px]" title={q.title}>{q.title}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5 + questions.length} className="text-center py-10 text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && responses.length === 0 && (
              <tr>
                <td colSpan={5 + questions.length} className="text-center py-10 text-muted-foreground">
                  Chưa có phản hồi nào.
                </td>
              </tr>
            )}
            {responses.map((r, i) => {
              const isAccepted = !!r.userId && acceptedUserIds.has(r.userId)
              const canAccept = !!r.userId && !isAccepted
              const isSelected = selectedIds.has(r.responseId)
              return (
                <tr
                  key={r.responseId}
                  className={`border-t transition-colors ${
                    isSelected ? "bg-blue-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-2">
                    {canAccept ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(r.responseId)}
                        className="cursor-pointer"
                      />
                    ) : (
                      <span />
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {r.user?.userName ?? `#${r.responseId}`}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {r.user?.email ?? r.respondentEmail ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(r.submittedAt).toLocaleDateString("vi-VN")}
                  </td>
                  {questions.map((q) => (
                    <td key={q.questionId} className="px-3 py-2 max-w-[200px]">
                      <div className="truncate max-w-[180px]" title={getAnswerDisplay(r, q.questionId)}>
                        {getAnswerDisplay(r, q.questionId)}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewResponse(r)}
                        title="Xem chi tiết"
                      >
                        <IconEye className="size-4" />
                      </Button>
                      {isAccepted ? (
                        <Badge variant="default" className="bg-green-600 text-white text-xs">
                          Đã chấp nhận
                        </Badge>
                      ) : canAccept ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acceptMut.isPending}
                          onClick={() => handleAcceptOne(r)}
                          className="text-[#0E5C63] border-[#0E5C63] hover:bg-[#0E5C63] hover:text-white text-xs"
                        >
                          <IconUserCheck className="size-3 mr-1" />
                          Chấp nhận
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!viewResponse} onOpenChange={() => setViewResponse(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phản hồi</DialogTitle>
          </DialogHeader>
          {viewResponse && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">
                    {viewResponse.user?.userName ?? viewResponse.respondentEmail ?? `#${viewResponse.responseId}`}
                  </span>
                  {viewResponse.user?.email && (
                    <p className="text-muted-foreground text-xs">{viewResponse.user.email}</p>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(viewResponse.submittedAt).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="border-t pt-4 space-y-4">
                {questions.map((q) => (
                  <div key={q.questionId} className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">{q.title}</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 rounded px-3 py-2">
                      {getAnswerDisplay(viewResponse, q.questionId)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
