"use client"

import { use, useState, useEffect, useCallback, Fragment } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getActivityById,
  updateActivity,
  updateActivityStatus,
  openCheckinSession,
  closeCheckinSession,
  openCheckoutSession,
  closeCheckoutSession,
  extendCheckinSession,
  extendCheckoutSession,
} from "@/services/activity.service"
import { getFormList } from "@/services/form.service"
import { getMyOrganization } from "@/services/organization.service"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"
import { toast } from "sonner"
import { getRegistrationsByActivity, matchTeam, type RegistrationDetailExtended } from "@/services/registration.service"

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  running: "bg-blue-100 text-blue-700",
  finished: "bg-purple-100 text-purple-600",
  cancelled: "bg-red-100 text-red-600",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  published: "Đã công bố",
  running: "Đang diễn ra",
  finished: "Đã kết thúc",
  cancelled: "Đã hủy",
}
const TYPE_LABEL: Record<string, string> = {
  program: "Chương trình",
  competition: "Cuộc thi",
  recruitment: "Tuyển sinh",
}
const FORM_STATUS_LABEL: Record<string, string> = {
  draft: "Bản nháp",
  open: "Đang mở",
  closed: "Đã đóng",
}

const CONFIG_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/system-config`
const AUTO_APPROVE_KEY = "registration.auto_approve"

export default function OrgEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [showFormPanel, setShowFormPanel] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<number | null | "">("")
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState("")
  const [showCheckinDialog, setShowCheckinDialog] = useState(false)
  const [checkinStartTime, setCheckinStartTime] = useState("")
  const [checkinDuration, setCheckinDuration] = useState("")
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [checkoutDuration, setCheckoutDuration] = useState("")
  const [now, setNow] = useState(() => new Date())
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [selectedIndividuals, setSelectedIndividuals] = useState<Set<number>>(new Set())
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  const [matchTeamName, setMatchTeamName] = useState("")
  const [matchLeaderId, setMatchLeaderId] = useState<number | null>(null)

  // Ticker for countdown display (updates every 10s)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(t)
  }, [])

  const { data: result, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => getActivityById(id),
  })

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })
  const organizationId = orgData?.data?.organizationId

  const { data: formsData } = useQuery({
    queryKey: ["org-forms-panel", organizationId],
    queryFn: () => getFormList({ organizationId, limit: 50 }),
    enabled: !!organizationId && showFormPanel,
  })

  // Auto-approve config
  const { data: autoApproveData, isLoading: autoApproveLoading } = useQuery({
    queryKey: ["auto-approve-config"],
    queryFn: () => http.get<{ success: boolean; data: { value: { enabled: boolean } } }>(
      `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`
    ),
  })
  const autoApproveEnabled = (autoApproveData as any)?.data?.value?.enabled === true

  const activity = result?.data
  const orgForms = (formsData as any)?.data?.data ?? []
  const activeSession = activity?.activeCheckinSession ?? null

  // Team registrations for competition events
  const isCompetition = activity?.activityType === "competition"
  const { data: teamRegData, isLoading: teamRegLoading } = useQuery({
    queryKey: ["team-registrations", id],
    queryFn: () => getRegistrationsByActivity(id, { limit: 100, registrationType: "group" }),
    enabled: !!activity && isCompetition,
  })
  const teamRegistrations: RegistrationDetailExtended[] = (teamRegData as any)?.data?.data ?? []

  // Individual registrations for competition events (looking for team)
  const { data: indivRegData, isLoading: indivRegLoading } = useQuery({
    queryKey: ["individual-registrations", id],
    queryFn: () => getRegistrationsByActivity(id, { limit: 100, registrationType: "individual" }),
    enabled: !!activity && isCompetition,
  })
  const individualRegistrations: RegistrationDetailExtended[] = (indivRegData as any)?.data?.data ?? []

  // ── Mutations ───────────────────────────────────────────────────────────────

  const submitMut = useMutation({
    mutationFn: () => updateActivityStatus(id, "pending_review"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      queryClient.invalidateQueries({ queryKey: ["my-org-activities"] })
      toast.success("Đã gửi yêu cầu duyệt!")
    },
    onError: () => toast.error("Gửi thất bại, vui lòng thử lại"),
  })

  const startMut = useMutation({
    mutationFn: () => updateActivityStatus(id, "running"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      queryClient.invalidateQueries({ queryKey: ["my-org-activities"] })
      toast.success("Sự kiện đã bắt đầu!")
    },
    onError: () => toast.error("Không thể bắt đầu sự kiện"),
  })

  const finishMut = useMutation({
    mutationFn: () => updateActivityStatus(id, "finished"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      queryClient.invalidateQueries({ queryKey: ["my-org-activities"] })
      toast.success("Sự kiện đã kết thúc!")
    },
    onError: () => toast.error("Không thể kết thúc sự kiện"),
  })

  const openCheckinMut = useMutation({
    mutationFn: ({ checkInTime, durationMinutes }: { checkInTime?: string; durationMinutes?: number }) =>
      openCheckinSession(id, {
        checkInTime: checkInTime || null,
        durationMinutes: durationMinutes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      setShowCheckinDialog(false)
      toast.success("Đã mở Check-in!")
    },
    onError: () => toast.error("Không thể mở Check-in"),
  })

  const handleOpenCheckinDialog = () => {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setCheckinStartTime(nowLocal)
    setCheckinDuration("")
    setShowCheckinDialog(true)
  }

  const handleConfirmCheckin = () => {
    openCheckinMut.mutate({
      checkInTime: checkinStartTime || undefined,
      durationMinutes: checkinDuration ? Number(checkinDuration) : undefined,
    })
  }

  const closeCheckinMut = useMutation({
    mutationFn: () => {
      if (!activeSession) throw new Error("No active session")
      return closeCheckinSession(id, activeSession.checkinId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      toast.success("Đã đóng Check-in!")
    },
    onError: () => toast.error("Không thể đóng Check-in"),
  })

  const openCheckoutMut = useMutation({
    mutationFn: ({ durationMinutes }: { durationMinutes?: number }) => {
      if (!activeSession) throw new Error("No active session")
      return openCheckoutSession(id, activeSession.checkinId, { durationMinutes: durationMinutes || null })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      setShowCheckoutDialog(false)
      toast.success("Đã mở Check-out!")
    },
    onError: () => toast.error("Không thể mở Check-out"),
  })

  const handleConfirmCheckout = () => {
    openCheckoutMut.mutate({ durationMinutes: checkoutDuration ? Number(checkoutDuration) : undefined })
  }

  const closeCheckoutMut = useMutation({
    mutationFn: () => {
      if (!activeSession) throw new Error("No active session")
      return closeCheckoutSession(id, activeSession.checkinId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      toast.success("Đã đóng Check-out!")
    },
    onError: () => toast.error("Không thể đóng Check-out"),
  })

  const extendCheckinMut = useMutation({
    mutationFn: (minutes: number) => {
      if (!activeSession) throw new Error("No active session")
      return extendCheckinSession(id, activeSession.checkinId, minutes)
    },
    onSuccess: (_, minutes) => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      toast.success(`Đã gia hạn Check-in thêm ${minutes} phút!`)
    },
    onError: () => toast.error("Không thể gia hạn"),
  })

  const extendCheckoutMut = useMutation({
    mutationFn: (minutes: number) => {
      if (!activeSession) throw new Error("No active session")
      return extendCheckoutSession(id, activeSession.checkinId, minutes)
    },
    onSuccess: (_, minutes) => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      toast.success(`Đã gia hạn Check-out thêm ${minutes} phút!`)
    },
    onError: () => toast.error("Không thể gia hạn"),
  })

  const autoApproveMut = useMutation({
    mutationFn: (enabled: boolean) =>
      http.put<{ success: boolean }>(
        `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`,
        { value: { enabled } }
      ),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["auto-approve-config"] })
      toast.success(enabled ? "Đã bật tự động duyệt" : "Đã tắt tự động duyệt")
    },
    onError: () => toast.error("Cập nhật thất bại"),
  })

  const updateFormMut = useMutation({
    mutationFn: (formId: number | null) => updateActivity(id, { registrationFormId: formId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      toast.success("Đã cập nhật biểu mẫu đăng ký")
      setShowFormPanel(false)
    },
    onError: () => toast.error("Cập nhật thất bại"),
  })

  const updateDeadlineMut = useMutation({
    mutationFn: (deadline: string | null) =>
      updateActivity(id, { registrationDeadline: deadline }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", id] })
      setShowDeadlineDialog(false)
      toast.success("Đã cập nhật hạn đăng ký")
    },
    onError: () => toast.error("Cập nhật thất bại"),
  })

  const handleOpenDeadlineDialog = () => {
    const current = activity?.registrationDeadline
    if (current) {
      const local = new Date(new Date(current).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setDeadlineInput(local)
    } else {
      setDeadlineInput("")
    }
    setShowDeadlineDialog(true)
  }

  const handleSaveDeadline = () => {
    const iso = deadlineInput ? new Date(deadlineInput).toISOString() : null
    updateDeadlineMut.mutate(iso)
  }

  const handleOpenFormPanel = () => {
    setSelectedFormId(activity?.registrationFormId ?? null)
    setShowFormPanel(true)
  }

  const handleSaveForm = () => {
    updateFormMut.mutate(selectedFormId === "" ? null : selectedFormId as number | null)
  }

  if (isLoading) {
    return <div className="px-[60px] py-8 text-muted-foreground">Đang tải...</div>
  }

  if (!activity) {
    return <div className="px-[60px] py-8 text-muted-foreground">Không tìm thấy hoạt động</div>
  }

  const isRunning = activity.activityStatus === "running"

  // Time-aware states (checkInCloseTime can be future/auto-expire)
  const checkinIsOpen = isRunning && !!activeSession?.checkInTime &&
    (!activeSession.checkInCloseTime || now < new Date(activeSession.checkInCloseTime))
  const checkinIsClosed = isRunning && !!activeSession?.checkInTime &&
    !!activeSession.checkInCloseTime && now >= new Date(activeSession.checkInCloseTime)

  const checkoutIsOpen = isRunning && !!activeSession?.checkOutTime &&
    (!activeSession.checkOutCloseTime || now < new Date(activeSession.checkOutCloseTime))
  const checkoutIsClosed = isRunning && !!activeSession?.checkOutTime &&
    !!activeSession.checkOutCloseTime && now >= new Date(activeSession.checkOutCloseTime)

  const canOpenCheckout = checkinIsClosed && !activeSession?.checkOutTime
  // Once checkout is fully closed, no new session allowed
  const sessionFullyDone = checkoutIsClosed || activity.hasCompletedCheckinSession

  // Countdown helpers
  const remainingMs = (closeTime: string | null | undefined) => {
    if (!closeTime) return null
    const diff = new Date(closeTime).getTime() - now.getTime()
    return diff > 0 ? diff : 0
  }
  const fmtCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const checkinRemaining = activeSession?.checkInCloseTime ? remainingMs(activeSession.checkInCloseTime) : null
  const checkoutRemaining = activeSession?.checkOutCloseTime ? remainingMs(activeSession.checkOutCloseTime) : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-[#0E5C63]">{activity.activityName}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[activity.activityStatus] ?? ""}`}>
              {STATUS_LABEL[activity.activityStatus] ?? activity.activityStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {TYPE_LABEL[activity.activityType] ?? activity.activityType}
            {activity.category && ` · ${activity.category.categoryName}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {activity.activityStatus === "draft" && (
            <button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending}
              className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
            >
              {submitMut.isPending ? "Đang gửi..." : "Gửi duyệt"}
            </button>
          )}
          <Link href={`/organization/event/${id}/participants`}
            className="bg-[#0E5C63] text-white px-3 py-1.5 rounded text-sm hover:bg-[#0a4a50]">
            Quản lý tham gia
          </Link>
        </div>
      </div>

      {/* ── Lifecycle management ─────────────────────────────────────────────── */}
      {(activity.activityStatus === "published" || isRunning) && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase">Quản lý vòng đời</p>

          {/* Main action buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            {activity.activityStatus === "published" && (
              <button onClick={() => startMut.mutate()} disabled={startMut.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                {startMut.isPending ? "Đang xử lý..." : "Bắt đầu sự kiện"}
              </button>
            )}

            {/* Mở Check-in: chỉ khi chưa có session VÀ chưa từng hoàn thành session */}
            {isRunning && !activeSession && !sessionFullyDone && (
              <button onClick={handleOpenCheckinDialog}
                className="bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700">
                Mở Check-in
              </button>
            )}

            {/* Đóng Check-in sớm (khi đang mở, có countdown hoặc không) */}
            {checkinIsOpen && (
              <button onClick={() => closeCheckinMut.mutate()} disabled={closeCheckinMut.isPending}
                className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 disabled:opacity-50">
                {closeCheckinMut.isPending ? "Đang đóng..." : "Đóng Check-in sớm"}
              </button>
            )}

            {/* Mở Check-out */}
            {canOpenCheckout && (
              <button onClick={() => { setCheckoutDuration(""); setShowCheckoutDialog(true) }}
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                Mở Check-out
              </button>
            )}

            {/* Đóng Check-out sớm */}
            {checkoutIsOpen && (
              <button onClick={() => closeCheckoutMut.mutate()} disabled={closeCheckoutMut.isPending}
                className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 disabled:opacity-50">
                {closeCheckoutMut.isPending ? "Đang đóng..." : "Đóng Check-out sớm"}
              </button>
            )}

            {isRunning && (
              <button onClick={() => finishMut.mutate()} disabled={finishMut.isPending}
                className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50">
                {finishMut.isPending ? "Đang xử lý..." : "Kết thúc sự kiện"}
              </button>
            )}
          </div>

          {/* Session status + countdown + extend */}
          {isRunning && activeSession && (
            <div className="space-y-2">
              {/* Check-in phase */}
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${checkinIsOpen ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                  {checkinIsOpen ? "Check-in đang mở" : "Check-in đã đóng"}
                </span>
                {checkinIsOpen && checkinRemaining !== null && (
                  <span className="text-orange-600 font-mono font-medium">
                    còn {fmtCountdown(checkinRemaining)}
                  </span>
                )}
                {checkinIsOpen && (
                  <span className="text-gray-400">
                    {checkinRemaining === null ? "Không giới hạn thời gian" : ""}
                  </span>
                )}
                {/* Gia hạn check-in */}
                {(checkinIsOpen || checkinIsClosed) && (
                  <div className="flex gap-1 ml-auto">
                    <span className="text-gray-400">Gia hạn:</span>
                    {[15, 30].map(m => (
                      <button key={m} onClick={() => extendCheckinMut.mutate(m)}
                        disabled={extendCheckinMut.isPending}
                        className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-xs hover:bg-teal-100 disabled:opacity-50">
                        +{m}p
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Check-out phase */}
              {activeSession.checkOutTime && (
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${checkoutIsOpen ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                    {checkoutIsOpen ? "Check-out đang mở" : "Check-out đã đóng"}
                  </span>
                  {checkoutIsOpen && checkoutRemaining !== null && (
                    <span className="text-orange-600 font-mono font-medium">
                      còn {fmtCountdown(checkoutRemaining)}
                    </span>
                  )}
                  {(checkoutIsOpen || checkoutIsClosed) && (
                    <div className="flex gap-1 ml-auto">
                      <span className="text-gray-400">Gia hạn:</span>
                      {[15, 30].map(m => (
                        <button key={m} onClick={() => extendCheckoutMut.mutate(m)}
                          disabled={extendCheckoutMut.isPending}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-xs hover:bg-indigo-100 disabled:opacity-50">
                          +{m}p
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {sessionFullyDone && isRunning && !activeSession && (
            <p className="text-xs text-gray-400">Phiên checkin/checkout đã kết thúc. Không thể mở thêm.</p>
          )}
        </div>
      )}

      {/* ── Auto-approve toggle ─────────────────────────────────────────────── */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Tự động duyệt đăng ký</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {autoApproveEnabled
                ? "Ai đăng ký sẽ được duyệt ngay"
                : "Tổ chức xét duyệt thủ công"}
            </p>
          </div>
          <button
            onClick={() => autoApproveMut.mutate(!autoApproveEnabled)}
            disabled={autoApproveLoading || autoApproveMut.isPending}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              "focus:outline-none disabled:opacity-50",
              autoApproveEnabled ? "bg-teal-600" : "bg-gray-300",
            ].join(" ")}
            role="switch"
            aria-checked={autoApproveEnabled}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                autoApproveEnabled ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Thời gian</p>
          <p className="text-sm">
            {activity.startTime ? new Date(activity.startTime).toLocaleDateString("vi-VN") : "—"}
            {" → "}
            {activity.endTime ? new Date(activity.endTime).toLocaleDateString("vi-VN") : "—"}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">Hạn đăng ký</p>
            <button onClick={handleOpenDeadlineDialog}
              className="text-xs text-teal-600 hover:underline">
              Gia hạn
            </button>
          </div>
          <p className="text-sm">
            {activity.registrationDeadline
              ? new Date(activity.registrationDeadline).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Không giới hạn"}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Địa điểm</p>
          <p className="text-sm">{activity.location ?? "—"}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Số lượng</p>
          <p className="text-sm">
            {activity._count?.registrations ?? 0} / {activity.maxParticipants ?? "∞"} người đăng ký
          </p>
        </div>
      </div>

      {/* Description */}
      {activity.description && (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Mô tả</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
        </div>
      )}

      {/* ── Registration Form Config ── */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase">Biểu mẫu đăng ký</p>
          <button
            onClick={handleOpenFormPanel}
            className="text-xs text-teal-600 hover:underline"
          >
            {activity.registrationForm ? "Đổi biểu mẫu" : "Gắn biểu mẫu"}
          </button>
        </div>

        {activity.registrationForm ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{activity.registrationForm.title}</p>
              {activity.registrationForm.description && (
                <p className="text-xs text-gray-500">{activity.registrationForm.description}</p>
              )}
            </div>
            <span className={[
              "text-xs px-1.5 py-0.5 rounded-full",
              activity.registrationForm.status === "open" ? "bg-green-100 text-green-700" :
              activity.registrationForm.status === "closed" ? "bg-red-100 text-red-600" :
              "bg-gray-100 text-gray-500"
            ].join(" ")}>
              {FORM_STATUS_LABEL[activity.registrationForm.status] ?? activity.registrationForm.status}
            </span>
            <Link
              href={`/organization/forms/${activity.registrationForm.formId}/responses`}
              className="text-xs text-teal-600 hover:underline"
            >
              Phản hồi
            </Link>
            <button
              onClick={() => updateFormMut.mutate(null)}
              disabled={updateFormMut.isPending}
              className="text-xs text-red-500 hover:underline"
            >
              Gỡ
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Chưa có biểu mẫu. Người dùng đăng ký trực tiếp.</p>
        )}
      </div>

      {/* ── Team list (competition only) ── */}
      {isCompetition && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Danh sách nhóm tham gia</p>
            <span className="text-xs text-gray-400">{teamRegistrations.length} nhóm</span>
          </div>

          {teamRegLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : teamRegistrations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có nhóm nào đăng ký.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">#</th>
                    <th className="px-3 py-2 text-left">Tên đội</th>
                    <th className="px-3 py-2 text-left">Trưởng nhóm</th>
                    <th className="px-3 py-2 text-center">Thành viên</th>
                    <th className="px-3 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamRegistrations.map((reg, idx) => {
                    const isExpanded = expandedTeam === reg.registrationId
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
                      approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700" },
                      rejected: { label: "Từ chối", cls: "bg-red-100 text-red-600" },
                      cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" },
                      waiting: { label: "Danh sách chờ", cls: "bg-blue-100 text-blue-600" },
                    }
                    const st = statusMap[reg.status] ?? { label: reg.status, cls: "bg-gray-100 text-gray-500" }
                    return (
                      <Fragment key={reg.registrationId}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedTeam(isExpanded ? null : reg.registrationId)}
                        >
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{reg.teamName ?? "—"}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {reg.user?.userName ?? "—"}
                            <span className="text-xs text-gray-400 ml-1">({reg.user?.email})</span>
                          </td>
                          <td className="px-3 py-2 text-center">{(reg.teamMembers?.length ?? 0) + 1}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${reg.registrationId}-detail`}>
                            <td colSpan={5} className="px-6 py-3 bg-gray-50">
                              <p className="text-xs font-medium text-gray-500 mb-2">Danh sách thành viên:</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="font-medium text-[#0E5C63]">👑 {reg.user?.userName}</span>
                                  <span className="text-gray-400">{reg.user?.email}</span>
                                  <span className="text-gray-400">{reg.user?.phoneNumber ?? "Chưa có SĐT"}</span>
                                  <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-[10px]">Trưởng nhóm</span>
                                </div>
                                {reg.teamMembers?.map(tm => (
                                  <div key={tm.userId} className="flex items-center gap-3 text-xs">
                                    <span className="font-medium">{tm.user?.userName}</span>
                                    <span className="text-gray-400">{tm.role ?? "Thành viên"}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Individual list (competition, waiting for team match) ── */}
      {isCompetition && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Đăng ký cá nhân (chờ ghép nhóm)</p>
            <span className="text-xs text-gray-400">{individualRegistrations.length} người</span>
          </div>

          {selectedIndividuals.size >= 2 && (
            <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm">
              <span className="text-teal-700 font-medium">Đã chọn {selectedIndividuals.size} người</span>
              <button
                onClick={() => {
                  setMatchTeamName("")
                  setMatchLeaderId(null)
                  setShowMatchDialog(true)
                }}
                className="bg-[#08667a] text-white px-3 py-1 rounded text-xs hover:bg-[#065a6c]"
              >
                Ghép nhóm
              </button>
              <button onClick={() => setSelectedIndividuals(new Set())} className="text-gray-500 text-xs underline ml-auto">Bỏ chọn</button>
            </div>
          )}

          {indivRegLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : individualRegistrations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có đăng ký cá nhân nào.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={individualRegistrations.length > 0 && individualRegistrations.every(r => selectedIndividuals.has(r.registrationId))}
                        onChange={() => {
                          const allIds = individualRegistrations.map(r => r.registrationId)
                          if (allIds.every(id => selectedIndividuals.has(id))) {
                            setSelectedIndividuals(new Set())
                          } else {
                            setSelectedIndividuals(new Set(allIds))
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">Họ tên</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">SĐT</th>
                    <th className="px-3 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {individualRegistrations.map(reg => {
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
                      approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700" },
                      rejected: { label: "Từ chối", cls: "bg-red-100 text-red-600" },
                      cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" },
                    }
                    const st = statusMap[reg.status] ?? { label: reg.status, cls: "bg-gray-100 text-gray-500" }
                    return (
                      <tr key={reg.registrationId} className={`hover:bg-gray-50 ${selectedIndividuals.has(reg.registrationId) ? "bg-teal-50" : ""}`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIndividuals.has(reg.registrationId)}
                            onChange={() => {
                              setSelectedIndividuals(prev => {
                                const next = new Set(prev)
                                if (next.has(reg.registrationId)) next.delete(reg.registrationId)
                                else next.add(reg.registrationId)
                                return next
                              })
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{reg.user?.userName ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-500">{reg.user?.email ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-500">{reg.user?.phoneNumber ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Deadline dialog ── */}
      {showDeadlineDialog && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Gia hạn nhận đơn</h2>
            <p className="text-xs text-gray-500">Đặt hoặc cập nhật thời hạn nhận đăng ký mới.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Thời hạn mới <span className="text-gray-400 font-normal">(để trống = không giới hạn)</span>
              </label>
              <input type="datetime-local" value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowDeadlineDialog(false)}
                className="px-4 py-1.5 border rounded text-sm">
                Hủy
              </button>
              <button onClick={handleSaveDeadline} disabled={updateDeadlineMut.isPending}
                className="px-4 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:opacity-50">
                {updateDeadlineMut.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkin dialog ── */}
      {showCheckinDialog && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Mở phiên Check-in</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" value={checkinStartTime}
                onChange={(e) => setCheckinStartTime(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tự động đóng sau <span className="text-gray-400 font-normal">(phút, để trống = không giới hạn)</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="480" value={checkinDuration}
                  onChange={(e) => setCheckinDuration(e.target.value)}
                  placeholder="VD: 30"
                  className="w-32 border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                <div className="flex gap-1">
                  {[15, 30, 60].map(m => (
                    <button key={m} type="button" onClick={() => setCheckinDuration(String(m))}
                      className={`px-2 py-1 text-xs rounded border ${checkinDuration === String(m) ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600 hover:border-teal-400"}`}>
                      {m}p
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowCheckinDialog(false)} className="px-4 py-1.5 border rounded text-sm">Hủy</button>
              <button onClick={handleConfirmCheckin} disabled={!checkinStartTime || openCheckinMut.isPending}
                className="px-4 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:opacity-50">
                {openCheckinMut.isPending ? "Đang mở..." : "Mở Check-in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout dialog ── */}
      {showCheckoutDialog && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Mở phiên Check-out</h2>
            <p className="text-xs text-gray-500">Chỉ những ai đã check-in mới có thể check-out.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tự động đóng sau <span className="text-gray-400 font-normal">(phút, để trống = không giới hạn)</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="480" value={checkoutDuration}
                  onChange={(e) => setCheckoutDuration(e.target.value)}
                  placeholder="VD: 30"
                  className="w-32 border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                <div className="flex gap-1">
                  {[15, 30, 60].map(m => (
                    <button key={m} type="button" onClick={() => setCheckoutDuration(String(m))}
                      className={`px-2 py-1 text-xs rounded border ${checkoutDuration === String(m) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-400"}`}>
                      {m}p
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowCheckoutDialog(false)} className="px-4 py-1.5 border rounded text-sm">Hủy</button>
              <button onClick={handleConfirmCheckout} disabled={openCheckoutMut.isPending}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50">
                {openCheckoutMut.isPending ? "Đang mở..." : "Mở Check-out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Form selection panel ── */}
      {showFormPanel && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Chọn biểu mẫu đăng ký</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chọn biểu mẫu từ thư viện của tổ chức. Người dùng sẽ điền khi đăng ký tham gia.
              </p>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {/* No form */}
              <label className={[
                "flex items-start gap-3 border rounded-lg p-3 cursor-pointer",
                selectedFormId === null ? "border-teal-600 bg-teal-50" : "border-gray-200"
              ].join(" ")}>
                <input type="radio" name="sel-form" checked={selectedFormId === null}
                  onChange={() => setSelectedFormId(null)} className="mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Không sử dụng biểu mẫu</p>
                  <p className="text-xs text-gray-500">Đăng ký trực tiếp, không cần điền thêm.</p>
                </div>
              </label>

              {orgForms.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  Chưa có biểu mẫu có sẵn.
                </p>
              )}

              {orgForms.map((f: any) => (
                <label key={f.formId} className={[
                  "flex items-start gap-3 border rounded-lg p-3 cursor-pointer",
                  selectedFormId === f.formId ? "border-teal-600 bg-teal-50" : "border-gray-200"
                ].join(" ")}>
                  <input type="radio" name="sel-form" checked={selectedFormId === f.formId}
                    onChange={() => setSelectedFormId(f.formId)} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{f.title}</p>
                      <span className={[
                        "text-xs px-1.5 py-0.5 rounded-full",
                        f.status === "open" ? "bg-green-100 text-green-700" :
                        f.status === "closed" ? "bg-red-100 text-red-600" :
                        "bg-gray-100 text-gray-500"
                      ].join(" ")}>
                        {FORM_STATUS_LABEL[f.status] ?? f.status}
                      </span>
                    </div>
                    {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{f._count?.responses ?? 0} phản hồi</p>
                  </div>
                </label>
              ))}

              <a
                href={`/organization/forms/create?activityId=${id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border-2 border-dashed border-teal-300 rounded-lg p-3 text-teal-600 hover:bg-teal-50 text-sm font-medium"
              >
                <span className="text-lg leading-none">+</span>
                Tạo biểu mẫu mới
              </a>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setShowFormPanel(false)}
                className="px-4 py-1.5 border rounded text-sm">
                Hủy
              </button>
              <button onClick={handleSaveForm} disabled={updateFormMut.isPending}
                className="px-4 py-1.5 bg-teal-700 text-white rounded text-sm disabled:opacity-50">
                {updateFormMut.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Match team dialog ── */}
      {showMatchDialog && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Ghép nhóm</h2>
            <p className="text-xs text-gray-500">Chọn {selectedIndividuals.size} người vào 1 nhóm mới.</p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên đội</label>
              <input
                value={matchTeamName}
                onChange={(e) => setMatchTeamName(e.target.value)}
                placeholder="Nhập tên đội..."
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trưởng nhóm</label>
              <select
                value={matchLeaderId ?? ""}
                onChange={(e) => setMatchLeaderId(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="">Chọn trưởng nhóm...</option>
                {individualRegistrations
                  .filter(r => selectedIndividuals.has(r.registrationId))
                  .map(r => (
                    <option key={r.registrationId} value={r.registrationId}>
                      {r.user?.userName} ({r.user?.email})
                    </option>
                  ))}
              </select>
            </div>

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Thành viên:</p>
              <ul className="space-y-0.5">
                {individualRegistrations
                  .filter(r => selectedIndividuals.has(r.registrationId))
                  .map(r => (
                    <li key={r.registrationId} className={r.registrationId === matchLeaderId ? "text-teal-700 font-medium" : ""}>
                      {r.registrationId === matchLeaderId ? "👑 " : "• "}
                      {r.user?.userName} — {r.user?.email}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMatchDialog(false)}
                className="px-4 py-1.5 border rounded text-sm"
              >
                Hủy
              </button>
              <button
                disabled={!matchTeamName.trim() || !matchLeaderId}
                onClick={async () => {
                  try {
                    const memberIds = Array.from(selectedIndividuals).filter(rid => rid !== matchLeaderId)
                    const res = await matchTeam({
                      activityId: Number(id),
                      teamName: matchTeamName.trim(),
                      leaderRegistrationId: matchLeaderId!,
                      memberRegistrationIds: memberIds,
                    }) as any
                    if (res?.success) {
                      toast.success(`Đã ghép nhóm "${matchTeamName.trim()}" thành công!`)
                      queryClient.invalidateQueries({ queryKey: ["team-registrations", id] })
                      queryClient.invalidateQueries({ queryKey: ["individual-registrations", id] })
                      setSelectedIndividuals(new Set())
                      setShowMatchDialog(false)
                    } else {
                      toast.error(res?.message ?? "Ghép nhóm thất bại")
                    }
                  } catch {
                    toast.error("Có lỗi xảy ra khi ghép nhóm")
                  }
                }}
                className="px-4 py-1.5 bg-teal-700 text-white rounded text-sm disabled:opacity-50"
              >
                Xác nhận ghép nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
