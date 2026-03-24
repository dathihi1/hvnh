"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { getActivityById } from "@/services/activity.service"
import {
  createRegistration,
  createRegistrationWithForm,
  getMyRegistrationByActivity,
  cancelRegistration,
  lookupUserByEmail,
  type MyActivityRegistration,
  type UserPreview,
} from "@/services/registration.service"
import { getFormPublic, submitForm, getMyFormResponse } from "@/services/form.service"
import type { Question, QuestionOption } from "@/types/form/form.types"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/ui-custom/SafeImage"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { getMe } from "@/services/auth.service"
import { useAuthModal } from "@/contexts/auth-modal.context"
import { Clock, CheckCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const TYPE_MAP: Record<string, string> = {
  program:     "Chương trình",
  competition: "Cuộc thi",
  recruitment: "Tuyển thành viên",
}

// ─── Button states ────────────────────────────────────────────────────────────

type ButtonState =
  | "no_more_registration"
  | "register"
  | "register_waitlist"
  | "waiting"
  | "registered"
  | "checkin"
  | "checked_in"
  | "checkin_closed"
  | "checkout"
  | "checked_out"
  | "finished"

function resolveButtonState(params: {
  activityStatus: string
  registrationDeadline: string | null
  maxParticipants: number | null
  registrationCount: number
  registration: MyActivityRegistration | null
  activeCheckinSession: {
    checkInTime: string | null
    checkInCloseTime: string | null
    checkOutTime: string | null
    checkOutCloseTime: string | null
  } | null
}): ButtonState {
  const {
    activityStatus, registrationDeadline, maxParticipants,
    registrationCount, registration, activeCheckinSession,
  } = params

  if (activityStatus === "finished") return "finished"

  if (registration) {
    const status = registration.status
    if (status === "waiting") return "waiting"
    if (status !== "cancelled" && status !== "rejected") {
      const latestCheckin = registration.registrationCheckins?.[0]

      if (latestCheckin?.checkOutTime) return "checked_out"

      if (activeCheckinSession) {
        const now2 = new Date()
        // Checkout window: opened AND (no close time OR close time in future)
        const checkoutWindowOpen =
          !!activeCheckinSession.checkOutTime &&
          (!activeCheckinSession.checkOutCloseTime || now2 < new Date(activeCheckinSession.checkOutCloseTime))
        // Checkin window: opened AND (no close time OR close time in future)
        const checkinWindowOpen =
          !!activeCheckinSession.checkInTime &&
          (!activeCheckinSession.checkInCloseTime || now2 < new Date(activeCheckinSession.checkInCloseTime))

        if (latestCheckin?.checkInTime) {
          if (checkoutWindowOpen) return "checkout"
          return "checked_in"
        }

        // User hasn't checked in
        if (!checkinWindowOpen) return "checkin_closed"
        if (status === "approved") return "checkin"
      }

      return "registered"
    }
  }

  const now = new Date()
  const deadlinePassed = registrationDeadline ? now > new Date(registrationDeadline) : false
  if (deadlinePassed) return "no_more_registration"

  const isFull = maxParticipants !== null && registrationCount >= maxParticipants
  if (isFull) return "register_waitlist"

  return "register"
}

// ─── Button config (label + color + icon + disabled) ─────────────────────────

interface BtnConfig {
  label: string
  textClass: string
  icon?: React.ReactNode
  disabled: boolean
}

const ICON_CLOCK = <Clock className="w-4 h-4 ml-2 shrink-0" />
const ICON_CHECK = <CheckCheck className="w-4 h-4 ml-2 shrink-0" />

const BUTTON_CONFIG: Record<ButtonState, BtnConfig> = {
  no_more_registration: { label: "Không còn nhận đơn", textClass: "text-red-400",   icon: ICON_CLOCK, disabled: true  },
  register:             { label: "Đăng ký tham gia",   textClass: "text-white",     icon: undefined,  disabled: false },
  register_waitlist:    { label: "Đăng ký hàng chờ",  textClass: "text-white",     icon: undefined,  disabled: false },
  waiting:              { label: "Đang chờ",            textClass: "text-white",     icon: undefined,  disabled: true  },
  registered:           { label: "Đã đăng ký",          textClass: "text-green-400", icon: ICON_CHECK, disabled: true  },
  checkin:              { label: "Check-in",            textClass: "text-white",     icon: ICON_CLOCK, disabled: false },
  checked_in:           { label: "Đã Check-in",         textClass: "text-green-400", icon: ICON_CHECK, disabled: true  },
  checkin_closed:       { label: "Hết giờ Check-in",   textClass: "text-white",     icon: ICON_CLOCK, disabled: true  },
  checkout:             { label: "Check-out",           textClass: "text-white",     icon: ICON_CLOCK, disabled: false },
  checked_out:          { label: "Đã check-out",        textClass: "text-green-400", icon: ICON_CHECK, disabled: true  },
  finished:             { label: "Đã kết thúc",         textClass: "text-white",     icon: ICON_CLOCK, disabled: true  },
}

export default function DetailEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { open: openAuthModal } = useAuthModal()
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [formAnswers, setFormAnswers] = useState<Record<number, { textValue?: string; selectedOptionIds?: number[] }>>({})
  const [formErrors, setFormErrors] = useState<Record<number, boolean>>({})
  const [mounted, setMounted] = useState(false)

  // Team registration state
  const [showRegModeDialog, setShowRegModeDialog] = useState(false)
  const [regMode, setRegMode] = useState<"individual" | "team">("individual")
  const [teamName, setTeamName] = useState("")
  const [teamMemberEmails, setTeamMemberEmails] = useState<string[]>([""])
  const [teamMemberUsers, setTeamMemberUsers] = useState<Record<number, UserPreview | null | "loading" | "duplicate" | undefined>>({})
  const [teamNameError, setTeamNameError] = useState("")

  // State to hold registration payload before form submission
  const [pendingRegPayload, setPendingRegPayload] = useState<any>(null)

  useEffect(() => { setMounted(true) }, [])

  const hasToken = mounted && document.cookie.includes("access_token=")

  const { data: activityData, isLoading, isError } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => getActivityById(id),
    enabled: !!id,
  })

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: hasToken,
  })

  const { data: regData, refetch: refetchReg } = useQuery({
    queryKey: ["my-registration", id],
    queryFn: () => getMyRegistrationByActivity(id),
    enabled: hasToken && !!id,
  })

  const formId = activityData?.data?.registrationForm?.formId
  const { data: formData, isLoading: formLoading } = useQuery({
    queryKey: ["form-public", formId],
    queryFn: () => getFormPublic(formId!),
    enabled: hasToken && !!formId,
    retry: false,
  })
  const registrationForm = (formData as any)?.data ?? null

  const { data: myResponseData, refetch: refetchMyResponse } = useQuery({
    queryKey: ["my-form-response", formId],
    queryFn: () => getMyFormResponse(formId!),
    enabled: hasToken && !!formId,
  })
  const myFormResponse = (myResponseData as any)?.data ?? null

  const activity = activityData?.data
  const user = meData?.data?.user
  const registration = (regData as any)?.data ?? null

  const registrationCount = activity?._count?.registrations ?? 0
  const spotsLeft = activity?.maxParticipants
    ? activity.maxParticipants - registrationCount
    : null

  const buttonState: ButtonState = activity
    ? resolveButtonState({
        activityStatus: activity.activityStatus,
        registrationDeadline: activity.registrationDeadline ?? null,
        maxParticipants: activity.maxParticipants ?? null,
        registrationCount,
        registration,
        activeCheckinSession: activity.activeCheckinSession ?? null,
      })
    : "finished"

  const btnCfg = BUTTON_CONFIG[buttonState]

  // Show cancel button when registered/waiting and deadline not passed
  const now = new Date()
  const deadlinePassed = activity?.registrationDeadline
    ? now > new Date(activity.registrationDeadline)
    : false
  const showCancel = (buttonState === "registered" || buttonState === "waiting") && !deadlinePassed

  const handleAction = async () => {
    if (!activity) return

    if (buttonState === "register" || buttonState === "register_waitlist") {
      if (!hasToken || !user) { openAuthModal(); return }
      if (!user.phoneNumber) { setShowPhoneDialog(true); return }

      // If activity supports team mode, show the mode selector first
      if (activity.teamMode === "team" || activity.teamMode === "both") {
        setRegMode("team")
        setTeamName("")
        setTeamMemberEmails([""])
        setTeamMemberUsers({})
        setTeamNameError("")
        setShowRegModeDialog(true)
        return
      }
    }

    if (buttonState === "register" || buttonState === "register_waitlist") {
      if (activity.registrationForm?.formId) {
        setPendingRegPayload({
          activityId: activity.activityId,
          registrationType: "individual",
        })
        setFormAnswers({})
        setShowFormDialog(true)
        return
      }
    }

    setLoading(true)
    try {
      if (buttonState === "register" || buttonState === "register_waitlist") {
        const res = await createRegistration({ activityId: activity.activityId }) as any
        if (res?.success) {
          toast.success(buttonState === "register_waitlist" ? "Đã vào hàng chờ!" : "Đăng ký thành công!")
          queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
          queryClient.invalidateQueries({ queryKey: ["activity", id] })
        } else {
          toast.error(res?.message ?? "Đăng ký thất bại")
        }
      } else if (buttonState === "checkin") {
        const checkinId = activity.activeCheckinSession?.checkinId
        if (!checkinId || !registration) return
        const res = await import("@/configs/http.comfig").then(({ http }) =>
          http.post<{ success: boolean }>(
            `${process.env.NEXT_PUBLIC_API_URL}/registrations/${registration.registrationId}/checkin`,
            { activityCheckinId: checkinId }
          )
        ) as any
        if (res?.success) { toast.success("Check-in thành công!"); refetchReg() }
        else toast.error(res?.message ?? "Check-in thất bại")
      } else if (buttonState === "checkout") {
        const checkinId = activity.activeCheckinSession?.checkinId
        if (!checkinId || !registration) return
        const res = await import("@/configs/http.comfig").then(({ http }) =>
          http.put<{ success: boolean }>(
            `${process.env.NEXT_PUBLIC_API_URL}/registrations/${registration.registrationId}/checkout`,
            { activityCheckinId: checkinId }
          )
        ) as any
        if (res?.success) { toast.success("Check-out thành công!"); refetchReg() }
        else toast.error(res?.message ?? "Check-out thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  const handleMemberEmailBlur = async (idx: number) => {
    const email = teamMemberEmails[idx]?.trim()
    if (!email) {
      setTeamMemberUsers(prev => ({ ...prev, [idx]: undefined }))
      return
    }

    // Check duplicate: same as leader
    if (email === user?.email) {
      setTeamMemberUsers(prev => ({ ...prev, [idx]: "duplicate" }))
      return
    }

    // Check duplicate: same as another member slot
    const isDuplicate = teamMemberEmails.some((e, i) => i !== idx && e.trim() === email)
    if (isDuplicate) {
      setTeamMemberUsers(prev => ({ ...prev, [idx]: "duplicate" }))
      return
    }

    setTeamMemberUsers(prev => ({ ...prev, [idx]: "loading" }))
    try {
      const res = await lookupUserByEmail(email) as any
      setTeamMemberUsers(prev => ({ ...prev, [idx]: res?.data ?? null }))
    } catch {
      setTeamMemberUsers(prev => ({ ...prev, [idx]: null }))
    }
  }

  const handleTeamSubmit = async () => {
    if (!activity || !user) return
    if (!teamName.trim()) { setTeamNameError("Vui lòng nhập tên đội"); return }
    setTeamNameError("")

    const minMembers = activity.activityTeamRule?.minTeamMembers ?? 1
    const maxMembers = activity.activityTeamRule?.maxTeamMembers ?? 99

    // Resolved member userIds (excluding empty slots)
    const memberIds: number[] = teamMemberEmails
      .map((_, i) => teamMemberUsers[i])
      .filter((u): u is UserPreview => !!u && u !== "loading")
      .map(u => u.userId)
      .filter(uid => uid !== user.userId)

    const totalTeam = 1 + memberIds.length // leader + members
    if (totalTeam < minMembers) {
      toast.error(`Nhóm cần ít nhất ${minMembers} thành viên`)
      return
    }
    if (totalTeam > maxMembers) {
      toast.error(`Nhóm tối đa ${maxMembers} thành viên`)
      return
    }

    const payload = {
      activityId: activity.activityId,
      registrationType: "group",
      teamName: teamName.trim(),
      teamMembers: memberIds.map(uid => ({ userId: uid, role: "member" })),
    }

    // Step 2: If activity has a registration form, open it next
    if (activity.registrationForm?.formId) {
      setPendingRegPayload(payload)
      setShowRegModeDialog(false)
      setFormAnswers({})
      setShowFormDialog(true)
      return
    }

    setLoading(true)
    try {
      const res = await createRegistration(payload) as any
      if (res?.success) {
        toast.success("Đăng ký nhóm thành công!")
        queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
        queryClient.invalidateQueries({ queryKey: ["activity", id] })
        setShowRegModeDialog(false)
      } else {
        toast.error(res?.message ?? "Đăng ký thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  const proceedIndividual = () => {
    setShowRegModeDialog(false)
    
    const payload = {
      activityId: activity!.activityId,
      registrationType: "individual",
      isLookingForTeam: true,
    }

    if (activity?.registrationForm?.formId) {
      setPendingRegPayload(payload)
      setFormAnswers({})
      setShowFormDialog(true)
    } else {
      // Direct register as individual looking for team
      setLoading(true)
      createRegistration(payload as any)
        .then((res: any) => {
          if (res?.success) {
            toast.success(buttonState === "register_waitlist" ? "Đã vào hàng chờ!" : "Đăng ký thành công!")
            queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
            queryClient.invalidateQueries({ queryKey: ["activity", id] })
          } else {
            toast.error(res?.message ?? "Đăng ký thất bại")
          }
        })
        .catch(() => toast.error("Có lỗi xảy ra"))
        .finally(() => setLoading(false))
    }
  }

  const handleCancel = async () => {
    if (!registration) return
    setCancelLoading(true)
    try {
      const res = await cancelRegistration(registration.registrationId) as any
      if (res?.success) {
        toast.success("Đã hủy đăng ký")
        queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
        queryClient.invalidateQueries({ queryKey: ["activity", id] })
      } else {
        toast.error(res?.message ?? "Hủy đăng ký thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setCancelLoading(false)
    }
  }

  const handleFormSubmit = async () => {
    if (!activity || !registrationForm) return
    const allQuestions: Question[] = registrationForm.sections?.flatMap((s: any) => s.questions ?? []) ?? []

    // Collect per-field errors
    const errors: Record<number, boolean> = {}
    for (const q of allQuestions) {
      if (!q.required) continue
      const ans = formAnswers[q.questionId]
      const hasText = typeof ans?.textValue === "string" && ans.textValue.trim() !== ""
      const hasOptions = Array.isArray(ans?.selectedOptionIds) && ans.selectedOptionIds.length > 0
      if (!hasText && !hasOptions) errors[q.questionId] = true
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
      return
    }
    setFormErrors({})
    setLoading(true)
    try {
      const answers = allQuestions.map((q) => {
        const ans = formAnswers[q.questionId] ?? {}
        return {
          questionId: q.questionId,
          textValue: ans.textValue ?? null,
          selectedOptionIds: ans.selectedOptionIds ?? [],
        }
      })
      const formPayload = {
        formId: registrationForm.formId,
        answers,
      }

      // We combine the pendingRegPayload and formResponse into a single API call
      // using createRegistrationWithForm (atomic transaction)
      const submitData = {
        ...(pendingRegPayload || {
          activityId: activity.activityId,
          registrationType: "individual",
        }),
        formResponse: formPayload,
      }

      const regRes = await createRegistrationWithForm(submitData) as any
      const routeMissingText = String(regRes?.error ?? regRes?.message ?? "").toLowerCase()
      const isWithFormRouteMissing =
        !regRes?.success &&
        routeMissingText.includes("with-form") &&
        (routeMissingText.includes("không tồn tại") || routeMissingText.includes("not found"))

      if (regRes?.success) {
        toast.success(buttonState === "register_waitlist" ? "Đã vào hàng chờ!" : "Đăng ký thành công!")
        queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
        queryClient.invalidateQueries({ queryKey: ["activity", id] })
        setShowFormDialog(false)
        refetchMyResponse()
      } else if (isWithFormRouteMissing) {
        // Fallback for older backend versions that do not have /registrations/with-form.
        const legacyRegRes = await createRegistration(
          (pendingRegPayload || {
            activityId: activity.activityId,
            registrationType: "individual",
          }) as any
        ) as any

        if (!legacyRegRes?.success) {
          toast.error(legacyRegRes?.message ?? "Đăng ký thất bại")
          return
        }

        const legacyFormRes = await submitForm(registrationForm.formId, { answers }) as any
        if (!legacyFormRes?.success) {
          toast.error(legacyFormRes?.message ?? "Đăng ký thành công nhưng gửi biểu mẫu thất bại")
          return
        }

        toast.success(buttonState === "register_waitlist" ? "Đã vào hàng chờ!" : "Đăng ký thành công!")
        queryClient.invalidateQueries({ queryKey: ["my-registration", id] })
        queryClient.invalidateQueries({ queryKey: ["activity", id] })
        setShowFormDialog(false)
        refetchMyResponse()
      } else {
        toast.error(regRes?.message ?? "Đăng ký thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[300px] bg-gray-200 mb-[30px]" />
        <div className="flex mx-[150px] gap-[20px]">
          <div className="w-[400px] h-[200px] bg-gray-100 rounded-xl" />
          <div className="flex-1 h-[200px] bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !activity) {
    return (
      <div className="text-center py-20 text-gray-500">
        Không tìm thấy sự kiện.{" "}
        <button onClick={() => router.back()} className="text-[#056382] underline">Quay lại</button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative h-[300px] mb-[30px]">
        <SafeImage
          src={activity.coverImage ?? "/hinh-nen-may-tinh-anime.jpg"}
          alt={activity.activityName}
          fill
          priority
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="flex mx-[150px] gap-[20px] mb-[30px]">
        <div
          className="border-[2px] w-[400px] bg-white rounded-xl p-6 space-y-2"
          style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
        >
          <div className="font-bold text-[16px] text-[#05566B] mb-3">Thông tin chính</div>
          <div className="text-[14px]">
            <span className="font-medium">Loại:</span>{" "}
            {TYPE_MAP[activity.activityType] ?? activity.activityType}
          </div>
          {activity.category && (
            <div className="text-[14px]">
              <span className="font-medium">Phân loại:</span>{" "}
              {activity.category.categoryName}
            </div>
          )}
          <div className="text-[14px]">
            <span className="font-medium">Bắt đầu:</span> {formatDate(activity.startTime)}
          </div>
          <div className="text-[14px]">
            <span className="font-medium">Kết thúc:</span> {formatDate(activity.endTime)}
          </div>
          <div className="text-[14px]">
            <span className="font-medium">Hạn đăng ký:</span> {formatDate(activity.registrationDeadline)}
          </div>
          <div className="text-[14px]">
            <span className="font-medium">Địa điểm:</span> {activity.location ?? "—"}
          </div>
          {spotsLeft !== null && (
            <div className="text-[14px]">
              <span className="font-medium">Còn lại:</span>{" "}
              <span className={spotsLeft <= 5 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                {spotsLeft} chỗ
              </span>
            </div>
          )}
          {activity.prize && (
            <div className="text-[14px]">
              <span className="font-medium">Giải thưởng:</span> {activity.prize}
            </div>
          )}
        </div>

        <div
          className="border-[2px] flex-1 p-6 rounded-[20px] space-y-3"
          style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
        >
          <h1 className="text-[22px] font-bold text-[#05566B]">{activity.activityName}</h1>
          {activity.organization && (
            <div className="text-[14px] text-gray-600">
              <span className="font-medium">Đơn vị tổ chức:</span>{" "}
              {activity.organization.organizationName}
            </div>
          )}
          {activity.description && (
            <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3 pb-[40px]">
        {/* Main action button */}
        <button
          onClick={handleAction}
          disabled={loading || btnCfg.disabled}
          className={`
            flex items-center justify-center
            bg-[#05566B] w-[220px] h-[50px] rounded-[20px]
            text-[15px] font-medium
            hover:brightness-110 transition-all
            disabled:opacity-60 disabled:cursor-not-allowed
            ${btnCfg.textClass}
          `}
        >
          {loading ? "Đang xử lý..." : (
            <>
              {btnCfg.label}
              {btnCfg.icon}
            </>
          )}
        </button>

        {/* Cancel button */}
        {showCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelLoading}
            className="text-[13px] text-red-500 hover:text-red-600 underline disabled:opacity-50"
          >
            {cancelLoading ? "Đang hủy..." : "Hủy đăng ký"}
          </button>
        )}
      </div>

      {/* My form response (read-only) */}
      {myFormResponse && (
        <div className="mx-[150px] mb-[30px] border rounded-2xl p-5 bg-white shadow-sm">
          <p className="text-sm font-semibold text-[#05566B] mb-3">Bài đã nộp</p>
          <div className="space-y-3">
            {myFormResponse.answers?.map((answer: any) => {
              const displayValue =
                answer.answerOptions?.length > 0
                  ? answer.answerOptions.map((ao: any) => ao.option?.label ?? ao.otherText ?? "").filter(Boolean).join(", ")
                  : answer.textValue ?? "—"
              return (
                <div key={answer.answerId}>
                  <p className="text-xs font-medium text-gray-600">{answer.question?.title}</p>
                  <p className="text-sm text-gray-800 mt-0.5">{displayValue}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Phone dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật số điện thoại</DialogTitle>
            <DialogDescription>
              Bạn cần cập nhật số điện thoại trước khi đăng ký tham gia sự kiện.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
              Hủy
            </Button>
            <Button
              className="bg-[#05566B] hover:bg-[#056382] text-white"
              onClick={() => { setShowPhoneDialog(false); router.push("/profile") }}
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration mode dialog (individual vs team) */}
      {showRegModeDialog && activity && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-[#05566B]">Đăng kí cuộc thi</h2>
            </div>

            {/* Toggle */}
            <div className="flex justify-center gap-2 pt-5 px-6">
              {(
                <button
                  onClick={() => setRegMode("individual")}
                  className={`px-6 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    regMode === "individual"
                      ? "bg-[#05566B] text-white border-[#05566B]"
                      : "text-[#05566B] border-[#05566B]"
                  }`}
                >
                  Cá nhân
                </button>
              )}
              <button
                onClick={() => setRegMode("team")}
                className={`px-6 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  regMode === "team"
                    ? "bg-[#05566B] text-white border-[#05566B]"
                    : "text-[#05566B] border-[#05566B]"
                }`}
              >
                Nhóm
              </button>
            </div>

            <div className="p-6 space-y-4">
              {regMode === "individual" ? (
                /* Individual: just show email confirmation */
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email:</label>
                    <div className="mt-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 select-none">
                      {user?.email ?? ""}
                    </div>
                    {user && (
                      <p className="text-xs text-[#05566B] mt-1">
                        {user.userName}{user.phoneNumber ? ` · ${user.phoneNumber}` : " · Chưa có SĐT"}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Team mode */
                <div className="space-y-4">
                  {activity.activityTeamRule && (
                    <p className="text-xs text-gray-500">
                      Số thành viên: {activity.activityTeamRule.minTeamMembers ?? 1} – {activity.activityTeamRule.maxTeamMembers ?? "∞"}
                    </p>
                  )}

                  {/* Team name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nhập tên đội</label>
                    <input
                      value={teamName}
                      onChange={e => { setTeamName(e.target.value); setTeamNameError("") }}
                      placeholder="Tên đội"
                      className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#05566B] ${teamNameError ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {teamNameError && <p className="text-xs text-red-500 mt-0.5">{teamNameError}</p>}
                  </div>

                  {/* Leader (read-only) */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email trưởng nhóm:</label>
                    <div className="mt-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 select-none">
                      {user?.email ?? ""}
                    </div>
                    {user && (
                      <p className="text-xs text-[#05566B] mt-0.5">
                        {user.userName} · {user.phoneNumber ?? "Sinh viên chưa cập nhật số điện thoại"} · Trưởng
                      </p>
                    )}
                  </div>

                  {/* Member email slots */}
                  {teamMemberEmails.map((email, idx) => {
                    const found = teamMemberUsers[idx]
                    return (
                      <div key={idx}>
                        <label className="text-sm font-medium text-gray-700">Nhập email thành viên:</label>
                        <input
                          value={email}
                          onChange={e => {
                            const next = [...teamMemberEmails]
                            next[idx] = e.target.value
                            setTeamMemberEmails(next)
                            setTeamMemberUsers(prev => ({ ...prev, [idx]: undefined }))
                          }}
                          onBlur={() => handleMemberEmailBlur(idx)}
                          placeholder="email@example.com"
                          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#05566B]"
                        />
                        {found === "loading" && (
                          <p className="text-xs text-gray-400 mt-0.5">Đang tìm...</p>
                        )}
                        {found === "duplicate" && (
                          <p className="text-xs text-red-400 mt-0.5">Email này đã được thêm rồi</p>
                        )}
                        {found && found !== "loading" && found !== "duplicate" && (
                          <p className={`text-xs mt-0.5 ${(found as UserPreview).phoneNumber ? "text-[#05566B]" : "text-yellow-600"}`}>
                            {(found as UserPreview).phoneNumber
                              ? `${(found as UserPreview).userName} · ${(found as UserPreview).phoneNumber}`
                              : `${(found as UserPreview).userName} · Sinh viên chưa cập nhật số điện thoại`}
                          </p>
                        )}
                        {found === null && email.trim() && (
                          <p className="text-xs text-red-400 mt-0.5">Không tìm thấy người dùng</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Add member button */}
                  {teamMemberEmails.length < (activity.activityTeamRule?.maxTeamMembers ?? 9) - 1 && (
                    <button
                      onClick={() => setTeamMemberEmails(prev => [...prev, ""])}
                      className="text-sm text-[#05566B] hover:underline"
                    >
                      + Thêm thành viên
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowRegModeDialog(false)}
                className="px-5 py-2 border rounded-xl text-sm"
              >
                Hủy
              </button>
              {regMode === "individual" ? (
                <button
                  onClick={proceedIndividual}
                  disabled={loading}
                  className="px-5 py-2 bg-[#05566B] text-white rounded-xl text-sm hover:bg-[#056382] disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận đăng ký"}
                </button>
              ) : (
                <button
                  onClick={handleTeamSubmit}
                  disabled={loading}
                  className="px-5 py-2 bg-[#05566B] text-white rounded-xl text-sm hover:bg-[#056382] disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Nộp form"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration form dialog */}
      {showFormDialog && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-[#05566B]">
                {registrationForm?.title ?? "Biểu mẫu đăng ký"}
              </h2>
              {registrationForm?.description && (
                <p className="text-sm text-gray-500 mt-1">{registrationForm.description}</p>
              )}
            </div>

            {formLoading && (
              <div className="p-10 text-center text-gray-400 text-sm">Đang tải biểu mẫu...</div>
            )}

            {!formLoading && !registrationForm && (
              <div className="p-10 text-center text-red-400 text-sm">
                Biểu mẫu chưa được mở hoặc không khả dụng. Vui lòng liên hệ ban tổ chức.
              </div>
            )}

            {!formLoading && registrationForm && (
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {registrationForm.sections?.flatMap((section: any) => section.questions ?? []).map((q: Question) => {
                const hasError = !!formErrors[q.questionId]
                const clearError = () => {
                  if (hasError) setFormErrors(prev => { const n = { ...prev }; delete n[q.questionId]; return n })
                }
                return (
                <div key={q.questionId}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {q.title}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.description && (
                    <p className="text-xs text-gray-500 mb-1.5">{q.description}</p>
                  )}

                  {(q.type === "short_text" || q.type === "date" || q.type === "time") && (
                    <input
                      type={q.type === "short_text" ? "text" : q.type}
                      value={formAnswers[q.questionId]?.textValue ?? ""}
                      onChange={(e) => {
                        setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], textValue: e.target.value } }))
                        if (e.target.value.trim()) clearError()
                      }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#05566B] ${hasError ? "border-red-500 bg-red-50" : ""}`}
                    />
                  )}

                  {q.type === "paragraph" && (
                    <textarea
                      rows={3}
                      value={formAnswers[q.questionId]?.textValue ?? ""}
                      onChange={(e) => {
                        setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], textValue: e.target.value } }))
                        if (e.target.value.trim()) clearError()
                      }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#05566B] resize-none ${hasError ? "border-red-500 bg-red-50" : ""}`}
                    />
                  )}

                  {q.type === "multiple_choice" && (
                    <div className={`space-y-2 ${hasError ? "p-2 rounded-lg border border-red-400 bg-red-50" : ""}`}>
                      {q.options.map((opt: QuestionOption) => (
                        <label key={opt.optionId} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.questionId}`}
                            checked={(formAnswers[q.questionId]?.selectedOptionIds ?? []).includes(opt.optionId)}
                            onChange={() => {
                              setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], selectedOptionIds: [opt.optionId] } }))
                              clearError()
                            }}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "checkboxes" && (
                    <div className={`space-y-2 ${hasError ? "p-2 rounded-lg border border-red-400 bg-red-50" : ""}`}>
                      {q.options.map((opt: QuestionOption) => {
                        const selected = formAnswers[q.questionId]?.selectedOptionIds ?? []
                        return (
                          <label key={opt.optionId} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.includes(opt.optionId)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...selected, opt.optionId]
                                  : selected.filter(x => x !== opt.optionId)
                                setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], selectedOptionIds: next } }))
                                if (next.length > 0) clearError()
                              }}
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {q.type === "dropdown" && (
                    <select
                      value={formAnswers[q.questionId]?.selectedOptionIds?.[0] ?? ""}
                      onChange={(e) => {
                        setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], selectedOptionIds: e.target.value ? [Number(e.target.value)] : [] } }))
                        if (e.target.value) clearError()
                      }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#05566B] ${hasError ? "border-red-500 bg-red-50" : ""}`}
                    >
                      <option value="">-- Chọn --</option>
                      {q.options.map((opt: QuestionOption) => (
                        <option key={opt.optionId} value={opt.optionId}>{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {q.type === "linear_scale" && (
                    <div className={`flex gap-2 flex-wrap ${hasError ? "p-2 rounded-lg border border-red-400 bg-red-50" : ""}`}>
                      {Array.from({ length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 }, (_, i) => i + (q.scaleMin ?? 1)).map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setFormAnswers(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], textValue: String(n) } }))
                            clearError()
                          }}
                          className={`w-10 h-10 rounded-full border text-sm font-medium transition-colors ${
                            formAnswers[q.questionId]?.textValue === String(n)
                              ? "bg-[#05566B] text-white border-[#05566B]"
                              : "border-gray-300 hover:border-[#05566B]"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}

                  {hasError && (
                    <p className="text-red-500 text-xs mt-1">Trường này là bắt buộc</p>
                  )}
                </div>
              )})}
            </div>
            )}

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowFormDialog(false); setFormErrors({}) }}
                className="px-5 py-2 border rounded-xl text-sm"
              >
                Hủy
              </button>
              {registrationForm && (
                <button
                  onClick={handleFormSubmit}
                  disabled={loading}
                  className="px-5 py-2 bg-[#05566B] text-white rounded-xl text-sm hover:bg-[#056382] disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
