"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SafeImage } from "@/components/ui-custom/SafeImage"
import { getOrganizationById, applyToOrg, getMyOrgApplication } from "@/services/organization.service"
import { getFormPublic, submitForm } from "@/services/form.service"
import type { Form, FormSection } from "@/types/form/form.types"
import { useAuthModal } from "@/contexts/auth-modal.context"

// ─── Inline form renderer (simple) ───────────────────────────────────────────

function FormField({
  question,
  value,
  onChange,
  error,
  onClearError,
}: {
  question: { questionId: number; title: string; type: string; required: boolean; options?: { optionId: number; label: string }[] }
  value: string | string[]
  onChange: (v: string | string[]) => void
  error?: boolean
  onClearError?: () => void
}) {
  const { questionId, title, type, required, options } = question

  const errClass = error ? "border-red-500 bg-red-50" : ""
  const errGroupClass = error ? "p-2 rounded-lg border border-red-400 bg-red-50" : ""
  const errMsg = error ? <p className="text-red-500 text-xs mt-1">Trường này là bắt buộc</p> : null

  if (type === "multiple_choice" || type === "radio") {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">
          {title}{required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <div className={`space-y-2 ${errGroupClass}`}>
          {options?.map((opt) => (
            <label key={opt.optionId} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name={`q-${questionId}`}
                checked={value === String(opt.optionId)}
                onChange={() => { onChange(String(opt.optionId)); onClearError?.() }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errMsg}
      </div>
    )
  }

  if (type === "checkboxes") {
    const vals = Array.isArray(value) ? value : []
    return (
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">
          {title}{required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <div className={`space-y-2 ${errGroupClass}`}>
          {options?.map((opt) => (
            <label key={opt.optionId} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={vals.includes(String(opt.optionId))}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...vals, String(opt.optionId)]
                    : vals.filter((v) => v !== String(opt.optionId))
                  onChange(next)
                  if (next.length > 0) onClearError?.()
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errMsg}
      </div>
    )
  }

  if (type === "paragraph") {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">
          {title}{required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <textarea
          className={`w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] ${errClass}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => { onChange(e.target.value); if (e.target.value.trim()) onClearError?.() }}
        />
        {errMsg}
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-1">
        {title}{required && <span className="text-red-500 ml-1">*</span>}
      </div>
      <input
        type={type === "date" ? "date" : "text"}
        className={`w-full border rounded-lg px-3 py-2 text-sm ${errClass}`}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => { onChange(e.target.value); if (e.target.value.trim()) onClearError?.() }}
      />
      {errMsg}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DetailClubPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { open: openModal } = useAuthModal()

  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [note, setNote] = useState("")
  const [formAnswers, setFormAnswers] = useState<Record<number, string | string[]>>({})
  const [formErrors, setFormErrors] = useState<Record<number, boolean>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => getOrganizationById(id),
    enabled: !!id,
  })

  const org = data?.data

  const hasToken =
    typeof window !== "undefined" &&
    !!document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)

  // My existing application (only fetch when logged in)
  const { data: myAppData, isLoading: myAppLoading } = useQuery({
    queryKey: ["my-org-application", id],
    queryFn: () => getMyOrgApplication(id),
    enabled: !!id && hasToken,
  })
  const myApp = myAppData?.data

  // Recruitment form (if any)
  const { data: formData, isLoading: formLoading } = useQuery({
    queryKey: ["form-public", org?.recruitmentFormId],
    queryFn: () => getFormPublic(org!.recruitmentFormId!),
    enabled: !!org?.recruitmentFormId,
  })
  const recruitForm = formData?.data as Form | undefined

  const applyMut = useMutation({
    mutationFn: async () => {
      // If there's a recruitment form, submit it first
      if (recruitForm && org?.recruitmentFormId) {
        const sections: FormSection[] = (recruitForm as any).sections ?? []
        const OPTION_TYPES = ["multiple_choice", "radio", "checkboxes", "dropdown"]
        const answers = sections.flatMap((sec: FormSection) =>
          sec.questions.map((q) => {
            const val = formAnswers[q.questionId]
            const isOptionType = OPTION_TYPES.includes(q.type)
            if (isOptionType) {
              const optionIds = Array.isArray(val)
                ? val.map(Number).filter(Boolean)
                : typeof val === "string" && val
                ? [Number(val)].filter(Boolean)
                : []
              return { questionId: q.questionId, optionIds }
            }
            return {
              questionId: q.questionId,
              textValue: typeof val === "string" ? val : undefined,
              optionIds: [],
            }
          })
        )
        await submitForm(org.recruitmentFormId, { answers })
      }
      return applyToOrg(id, { note: note.trim() || undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-org-application", id] })
      setShowApplyDialog(false)
      setNote("")
      setFormAnswers({})
      setFormErrors({})
      toast.success("Đã nộp đơn ứng tuyển thành công!")
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Nộp đơn thất bại"
      toast.error(msg)
    },
  })

  const handleApplyClick = () => {
    if (!hasToken) {
      openModal()
      return
    }
    setFormAnswers({})
    setFormErrors({})
    setShowApplyDialog(true)
  }

  const handleSubmitApply = () => {
    if (!recruitForm) { applyMut.mutate(); return }
    const sections = (recruitForm as any).sections ?? []
    const allQuestions = sections.flatMap((s: any) => s.questions ?? [])
    const errors: Record<number, boolean> = {}
    for (const q of allQuestions) {
      if (!q.required) continue
      const val = formAnswers[q.questionId]
      const hasText = typeof val === "string" && val.trim() !== ""
      const hasOptions = Array.isArray(val) && val.length > 0
      if (!hasText && !hasOptions) errors[q.questionId] = true
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
      return
    }
    setFormErrors({})
    applyMut.mutate()
  }

  const isApplyDeadlinePassed = org?.applyDeadline
    ? new Date() > new Date(org.applyDeadline)
    : false

  const canApply =
    org?.isRecruiting &&
    !isApplyDeadlinePassed &&
    !myApp &&
    !myAppLoading

  return (
    <div>
      {/* Cover */}
      <div className="relative w-full h-[160px] sm:h-[220px] md:h-[300px] lg:h-[340px] overflow-hidden">
        <SafeImage
          src={org?.coverImageUrl ?? "/team-building.jpg"}
          alt={org?.organizationName ?? "cover"}
          fill
          priority
          fallbackSrc="/team-building.jpg"
          className="object-cover object-center"
        />
      </div>

      {/* Three columns: left image | logo + name | right image */}
      <div className="flex items-center gap-3 sm:gap-5 md:gap-8 px-3 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-7 md:py-8">
        <div className="relative flex-1 h-[130px] sm:h-[190px] md:h-[250px] lg:h-[288px] rounded-2xl md:rounded-[29px] overflow-hidden">
          <SafeImage
            src={org?.leftImageUrl ?? org?.coverImageUrl ?? "/team-building.jpg"}
            alt="left"
            fill
            fallbackSrc="/team-building.jpg"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 w-[80px] sm:w-[120px] md:w-[160px] lg:w-[200px]">
          <div className="relative rounded-full overflow-hidden border-4 border-white shadow-lg
            w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px]">
            <SafeImage
              src={org?.logoUrl ?? "/logo-club.jpg"}
              alt="logo"
              fill
              fallbackSrc="/logo-club.jpg"
              className="object-cover"
            />
          </div>
          <div className="text-[#1A73E8] text-[10px] sm:text-[13px] md:text-[16px] lg:text-[20px] font-bold text-center leading-tight">
            {isLoading ? "Đang tải..." : org?.organizationName ?? "—"}
          </div>
        </div>

        <div className="relative flex-1 h-[130px] sm:h-[190px] md:h-[250px] lg:h-[288px] rounded-2xl md:rounded-[29px] overflow-hidden">
          <SafeImage
            src={org?.rightImageUrl ?? org?.coverImageUrl ?? "/team-building.jpg"}
            alt="right"
            fill
            fallbackSrc="/team-building.jpg"
            className="object-cover"
          />
        </div>
      </div>

      {/* Giới thiệu */}
      <div className="flex items-center w-full my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]" />
        <div className="px-0">
          <span className="bg-[#08667a] text-white px-8 py-2 rounded-full font-bold text-[16px] whitespace-nowrap uppercase tracking-wider">
            Giới thiệu
          </span>
        </div>
        <div className="flex-1 h-[3px] bg-[#08667a]" />
      </div>

      <div className="mx-3 sm:mx-5 md:mx-[20px] rounded-[20px] border-[3px] border-[#1A73E8] p-4 sm:p-[20px] min-h-[150px] sm:min-h-[200px] text-sm sm:text-base">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : (
          <p className="whitespace-pre-line">{org?.description ?? "Chưa có mô tả."}</p>
        )}
      </div>

      {/* Liên hệ */}
      <div className="flex items-center w-full my-8 md:my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]" />
        <span className="bg-[#08667a] text-white px-6 sm:px-8 py-2 rounded-full font-bold text-[13px] sm:text-[15px] md:text-[16px] uppercase tracking-wider">
          Liên hệ
        </span>
        <div className="flex-1 h-[3px] bg-[#08667a]" />
      </div>
      <div className="mx-3 sm:mx-5 md:mx-[20px] rounded-[20px] border-[3px] border-[#1A73E8] p-4 sm:p-5 space-y-3 text-sm sm:text-base">
        <div><span className="font-semibold">Tiktok:</span>{" "}<span className="text-gray-700">{(org as any)?.tiktokUrl ?? ""}</span></div>
        <div><span className="font-semibold">Email:</span>{" "}<span className="text-gray-700">{org?.email ?? ""}</span></div>
        <div><span className="font-semibold">Facebook:</span>{" "}<span className="text-gray-700">{(org as any)?.facebookUrl ?? ""}</span></div>
        <div><span className="font-semibold">Số điện thoại:</span>{" "}<span className="text-gray-700">{(org as any)?.phoneNumber ?? ""}</span></div>
      </div>

      {/* Recruitment info */}
      {org?.isRecruiting && (
        <div className="mx-[20px] mt-6 p-4 rounded-xl bg-teal-50 border border-teal-300 text-teal-700 text-sm space-y-1">
          <div className="font-bold text-base">CLB đang tuyển thành viên!</div>
          {org.applyDeadline && (
            <div>Hạn nộp đơn: {new Date(org.applyDeadline).toLocaleString("vi-VN")}</div>
          )}
          {org.responseDeadline && (
            <div>Hạn phản hồi: {new Date(org.responseDeadline).toLocaleString("vi-VN")}</div>
          )}
          {org.interviewSchedule && (
            <div>Phỏng vấn: {new Date(org.interviewSchedule).toLocaleString("vi-VN")}</div>
          )}
        </div>
      )}

      {/* Apply status / button */}
      <div className="flex flex-col items-center my-8 gap-4">
        {!org?.isRecruiting ? (
          <h1 className="text-[24px] font-bold text-center text-[#1A73E8]">
            CÂU LẠC BỘ HIỆN KHÔNG MỞ ĐƠN TUYỂN THÀNH VIÊN!
          </h1>
        ) : isApplyDeadlinePassed ? (
          <h1 className="text-[20px] font-bold text-center text-red-500">
            Đã hết hạn nộp đơn ứng tuyển.
          </h1>
        ) : myApp ? (
          <div className="text-center">
            <div className="inline-block px-6 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
              Đã nộp đơn ứng tuyển
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Trạng thái:{" "}
              <span className="font-medium">
                {myApp.result === "pending"
                  ? "Đang chờ xem xét"
                  : myApp.result === "interview"
                  ? "Được mời phỏng vấn"
                  : myApp.result === "accepted"
                  ? "Đã được nhận"
                  : "Không được nhận"}
              </span>
            </div>
          </div>
        ) : (
          <button
            className="bg-[#08667a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#06505f] transition text-[18px]"
            onClick={handleApplyClick}
          >
            Ứng tuyển vào CLB
          </button>
        )}

        <Link
          href={`/club/${id}/member`}
          className="bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition"
        >
          Xem thành viên
        </Link>
      </div>

      {/* Apply dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => { setShowApplyDialog(false); setFormErrors({}) }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-lg font-bold text-[#0E5C63] mb-4">Ứng tuyển vào CLB</h2>

            {/* Show recruitment form if available */}
            {formLoading ? (
              <div className="text-center py-8 text-gray-400">Đang tải biểu mẫu...</div>
            ) : recruitForm ? (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 mb-3">
                  Vui lòng điền biểu mẫu để ứng tuyển:
                </div>
                {((recruitForm as any).sections ?? []).map((sec: any) => (
                  <div key={sec.sectionId}>
                    {sec.title && (
                      <div className="font-semibold text-sm text-gray-700 mb-2">{sec.title}</div>
                    )}
                    {(sec.questions ?? []).map((q: any) => (
                      <FormField
                        key={q.questionId}
                        question={q}
                        value={formAnswers[q.questionId] ?? ""}
                        onChange={(v) => {
                          setFormAnswers((prev) => ({ ...prev, [q.questionId]: v }))
                        }}
                        error={!!formErrors[q.questionId]}
                        onClearError={() => setFormErrors((prev) => { const n = { ...prev }; delete n[q.questionId]; return n })}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                placeholder="Lý do muốn tham gia CLB..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border text-sm"
                onClick={() => { setShowApplyDialog(false); setFormErrors({}) }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#08667a] text-white text-sm disabled:opacity-50"
                disabled={applyMut.isPending}
                onClick={handleSubmitApply}
              >
                {applyMut.isPending ? "Đang nộp..." : "Nộp đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
