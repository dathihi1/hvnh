"use client"

import { useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Camera } from "lucide-react"
import { SafeImage } from "@/components/ui-custom/SafeImage"
import {
  getMyOrganization,
  updateMyOrganization,
  openRecruitment,
  closeRecruitment,
  updateRecruitment,
  type RecruitmentPayload,
} from "@/services/organization.service"
import { uploadFileToS3 } from "@/services/upload.service"
import { getFormList } from "@/services/form.service"
import type { Form } from "@/types/form/form.types"

// ─── Clickable image (only in edit mode) ─────────────────────────────────────

function EditableImage({
  src,
  fallbackSrc,
  alt,
  fill,
  width,
  height,
  className,
  editable,
  onUploaded,
  folder,
  rounded,
}: {
  src: string
  fallbackSrc: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  editable: boolean
  onUploaded: (key: string) => void
  folder: "covers" | "logos" | "avatars" | "documents"
  rounded?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Vui lòng chọn file ảnh"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return }
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const key = await uploadFileToS3(file, folder)
      if (key) { onUploaded(key); toast.success("Cập nhật ảnh thành công") }
      else { toast.error("Upload thất bại"); setPreview(null) }
    } catch {
      toast.error("Upload thất bại"); setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displaySrc = preview ?? src

  const imageEl = fill ? (
    <SafeImage src={displaySrc} alt={alt} fill fallbackSrc={fallbackSrc} className={className} />
  ) : (
    <SafeImage src={displaySrc} alt={alt} width={width!} height={height!} fallbackSrc={fallbackSrc} className={className} />
  )

  if (!editable) return <>{imageEl}</>

  return (
    <div
      className={`relative cursor-pointer group ${rounded ? "rounded-full overflow-hidden" : ""}`}
      style={fill ? { position: "absolute", inset: 0 } : undefined}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {imageEl}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
        {uploading ? (
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ─── Overlay dialog ───────────────────────────────────────────────────────────

function OverlayDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        {children}
      </div>
    </div>
  )
}

// ─── Form selector ────────────────────────────────────────────────────────────

function FormSelector({ organizationId, selectedId, onSelect }: { organizationId: number; selectedId: number | null; onSelect: (id: number | null) => void }) {
  const { data } = useQuery({
    queryKey: ["forms", { organizationId }],
    queryFn: () => getFormList({ organizationId, limit: 50 }),
    enabled: !!organizationId,
  })
  const forms: Form[] = (data?.data as any)?.data ?? []
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
      <div
        className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedId === null ? "bg-teal-600 text-white" : "hover:bg-gray-100"}`}
        onClick={() => onSelect(null)}
      >
        Không có biểu mẫu
      </div>
      {forms.map((f) => (
        <div
          key={f.formId}
          className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedId === f.formId ? "bg-teal-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => onSelect(f.formId)}
        >
          {f.title}
        </div>
      ))}
    </div>
  )
}

// ─── Recruitment dialog ───────────────────────────────────────────────────────

function RecruitmentDialog({ open, onClose, title, organizationId, value, onChange, isPending, onSubmit }: {
  open: boolean; onClose: () => void; title: string; organizationId: number
  value: RecruitmentPayload; onChange: (v: RecruitmentPayload) => void; isPending: boolean; onSubmit: () => void
}) {
  const [wantForm, setWantForm] = useState(false)
  return (
    <OverlayDialog open={open} onClose={onClose}>
      <h2 className="text-lg font-bold text-[#0E5C63] mb-4">{title}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp đơn</label>
          <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm" value={value.applyDeadline ?? ""} onChange={(e) => onChange({ ...value, applyDeadline: e.target.value || null })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hạn phản hồi</label>
          <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm" value={value.responseDeadline ?? ""} onChange={(e) => onChange({ ...value, responseDeadline: e.target.value || null })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lịch phỏng vấn</label>
          <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm" value={value.interviewSchedule ?? ""} onChange={(e) => onChange({ ...value, interviewSchedule: e.target.value || null })} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={wantForm}
              onChange={(e) => { setWantForm(e.target.checked); if (!e.target.checked) onChange({ ...value, recruitmentFormId: null }) }}
            />
            Thêm biểu mẫu khảo sát
          </label>
        </div>
        {wantForm && organizationId > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn biểu mẫu</label>
            <FormSelector organizationId={organizationId} selectedId={value.recruitmentFormId ?? null} onSelect={(id) => onChange({ ...value, recruitmentFormId: id })} />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <button className="px-4 py-2 rounded-lg border text-sm" onClick={onClose}>Hủy</button>
        <button className="px-4 py-2 rounded-lg bg-[#08667a] text-white text-sm disabled:opacity-50" disabled={isPending} onClick={onSubmit}>
          {isPending ? "Đang lưu..." : "Xác nhận"}
        </button>
      </div>
    </OverlayDialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClubInfoPage() {
  const queryClient = useQueryClient()

  // Image editing mode — fully independent from info edit dialog
  const [isEditing, setIsEditing] = useState(false)

  // Text edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editTiktok, setEditTiktok] = useState("")
  const [editFacebook, setEditFacebook] = useState("")
  const [editPhone, setEditPhone] = useState("")

  // Recruitment dialogs
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [recForm, setRecForm] = useState<RecruitmentPayload>({
    applyDeadline: null,
    responseDeadline: null,
    interviewSchedule: null,
    recruitmentFormId: null,
  })

  const { data: orgData, isLoading } = useQuery({ queryKey: ["my-organization"], queryFn: getMyOrganization })
  const org = orgData?.data

  // Save a single image field immediately after upload
  const saveImageField = async (field: string, key: string) => {
    await updateMyOrganization(org!.organizationId, { [field]: key } as any)
    queryClient.invalidateQueries({ queryKey: ["my-organization"] })
  }

  const editMut = useMutation({
    mutationFn: (data: { organizationName: string; description: string; email?: string; tiktokUrl?: string; facebookUrl?: string; phoneNumber?: string }) =>
      updateMyOrganization(org!.organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-organization"] })
      setShowEditDialog(false)
      toast.success("Cập nhật thông tin thành công")
      // isEditing is NOT changed here — user can still edit images after saving text
    },
    onError: () => toast.error("Cập nhật thất bại"),
  })

  const openMut = useMutation({
    mutationFn: (data: RecruitmentPayload) => openRecruitment(org!.organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-organization"] })
      setShowOpenDialog(false)
      toast.success("Đã mở đơn đăng ký")
    },
    onError: () => toast.error("Mở đơn thất bại"),
  })

  const closeMut = useMutation({
    mutationFn: () => closeRecruitment(org!.organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-organization"] })
      toast.success("Đã đóng đơn đăng ký")
    },
    onError: () => toast.error("Đóng đơn thất bại"),
  })

  const updateMut = useMutation({
    mutationFn: (data: RecruitmentPayload) => updateRecruitment(org!.organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-organization"] })
      setShowUpdateDialog(false)
      toast.success("Đã cập nhật đơn đăng ký")
    },
    onError: () => toast.error("Cập nhật thất bại"),
  })

  const handleClickEditInfo = () => {
    setEditName(org?.organizationName ?? "")
    setEditDesc(org?.description ?? "")
    setEditEmail(org?.email ?? "")
    setEditTiktok((org as any)?.tiktokUrl ?? "")
    setEditFacebook((org as any)?.facebookUrl ?? "")
    setEditPhone((org as any)?.phoneNumber ?? "")
    setShowEditDialog(true)
  }

  const handleOpenRecruitDialog = () => {
    setRecForm({
      applyDeadline: org?.applyDeadline?.slice(0, 16) ?? null,
      responseDeadline: org?.responseDeadline?.slice(0, 16) ?? null,
      interviewSchedule: org?.interviewSchedule?.slice(0, 16) ?? null,
      recruitmentFormId: org?.recruitmentFormId ?? null,
    })
    setShowOpenDialog(true)
  }

  const handleOpenUpdateDialog = () => {
    setRecForm({
      applyDeadline: org?.applyDeadline?.slice(0, 16) ?? null,
      responseDeadline: org?.responseDeadline?.slice(0, 16) ?? null,
      interviewSchedule: org?.interviewSchedule?.slice(0, 16) ?? null,
      recruitmentFormId: org?.recruitmentFormId ?? null,
    })
    setShowUpdateDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-400">Đang tải...</div>
      </div>
    )
  }

  const coverSrc = org?.coverImageUrl ?? "/team-building.jpg"
  const leftSrc = org?.leftImageUrl ?? "/team-building.jpg"
  const rightSrc = org?.rightImageUrl ?? "/team-building.jpg"
  const logoSrc = org?.logoUrl ?? "/logo-club.jpg"

  return (
    <div>
      {/* ── Ảnh nền (cover) — toàn bộ chiều rộng ── */}
      <div className="relative w-full h-[160px] sm:h-[220px] md:h-[300px] lg:h-[340px] overflow-hidden">
        <EditableImage
          src={coverSrc}
          fallbackSrc="/team-building.jpg"
          alt="cover"
          fill
          className="object-cover object-center"
          editable={isEditing}
          folder="covers"
          onUploaded={(key) => saveImageField("coverImageUrl", key)}
        />
      </div>

      {/* ── Ba cột: ảnh trái | logo + tên | ảnh phải ── */}
      <div className="flex items-center gap-3 sm:gap-5 md:gap-8 px-3 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-7 md:py-8">

        {/* Ảnh trái */}
        <div className="relative flex-1 h-[130px] sm:h-[190px] md:h-[250px] lg:h-[288px] rounded-2xl md:rounded-[29px] overflow-hidden">
          <EditableImage
            src={leftSrc}
            fallbackSrc="/team-building.jpg"
            alt="left"
            fill
            className="object-cover"
            editable={isEditing}
            folder="covers"
            onUploaded={(key) => saveImageField("leftImageUrl", key)}
          />
        </div>

        {/* Logo tròn + tên */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 w-[80px] sm:w-[120px] md:w-[160px] lg:w-[200px]">
          <div className="relative rounded-full overflow-hidden border-4 border-white shadow-lg
            w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px]">
            <EditableImage
              src={logoSrc}
              fallbackSrc="/logo-club.jpg"
              alt="logo"
              fill
              className="object-cover"
              editable={isEditing}
              folder="logos"
              rounded
              onUploaded={(key) => saveImageField("logoUrl", key)}
            />
          </div>
          <div className="text-[#1A73E8] text-[10px] sm:text-[13px] md:text-[16px] lg:text-[20px] font-bold text-center leading-tight">
            {org?.organizationName ?? "—"}
          </div>
        </div>

        {/* Ảnh phải */}
        <div className="relative flex-1 h-[130px] sm:h-[190px] md:h-[250px] lg:h-[288px] rounded-2xl md:rounded-[29px] overflow-hidden">
          <EditableImage
            src={rightSrc}
            fallbackSrc="/team-building.jpg"
            alt="right"
            fill
            className="object-cover"
            editable={isEditing}
            folder="covers"
            onUploaded={(key) => saveImageField("rightImageUrl", key)}
          />
        </div>
      </div>

      {isEditing && (
        <p className="text-center text-xs text-teal-600 -mt-3 mb-4">
          Click vào ảnh để thay đổi
        </p>
      )}

      {/* ── GIỚI THIỆU ── */}
      <div className="flex items-center w-full my-8 md:my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]" />
        <span className="bg-[#08667a] text-white px-6 sm:px-8 py-2 rounded-full font-bold text-[13px] sm:text-[15px] md:text-[16px] uppercase tracking-wider">
          Giới thiệu
        </span>
        <div className="flex-1 h-[3px] bg-[#08667a]" />
      </div>

      <div className="mx-3 sm:mx-5 md:mx-5 rounded-[20px] border-[3px] border-[#1A73E8] p-4 sm:p-5 min-h-[150px] sm:min-h-[200px] whitespace-pre-line text-sm sm:text-base">
        {org?.description ?? "Chưa có mô tả."}
      </div>

      {/* ── LIÊN HỆ ── */}
      <div className="flex items-center w-full my-8 md:my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]" />
        <span className="bg-[#08667a] text-white px-6 sm:px-8 py-2 rounded-full font-bold text-[13px] sm:text-[15px] md:text-[16px] uppercase tracking-wider">
          Liên hệ
        </span>
        <div className="flex-1 h-[3px] bg-[#08667a]" />
      </div>
      <div className="mx-3 sm:mx-5 md:mx-5 rounded-[20px] border-[3px] border-[#1A73E8] p-4 sm:p-5 space-y-3 text-sm sm:text-base">
        <div><span className="font-semibold">Tiktok:</span>{" "}<span className="text-gray-700">{(org as any)?.tiktokUrl ?? ""}</span></div>
        <div><span className="font-semibold">Email:</span>{" "}<span className="text-gray-700">{org?.email ?? ""}</span></div>
        <div><span className="font-semibold">Facebook:</span>{" "}<span className="text-gray-700">{(org as any)?.facebookUrl ?? ""}</span></div>
        <div><span className="font-semibold">Số điện thoại:</span>{" "}<span className="text-gray-700">{(org as any)?.phoneNumber ?? ""}</span></div>
      </div>

      {/* ── Recruitment info banner ── */}
      {org?.isRecruiting && (
        <div className="mx-3 sm:mx-5 mt-6 p-4 rounded-xl bg-teal-50 border border-teal-300 text-teal-700 text-sm space-y-1">
          <div className="font-bold text-base">Đang mở đơn tuyển thành viên</div>
          {org.applyDeadline && <div>Hạn nộp đơn: {new Date(org.applyDeadline).toLocaleString("vi-VN")}</div>}
          {org.responseDeadline && <div>Hạn phản hồi: {new Date(org.responseDeadline).toLocaleString("vi-VN")}</div>}
          {org.interviewSchedule && <div>Phỏng vấn: {new Date(org.interviewSchedule).toLocaleString("vi-VN")}</div>}
          {org.recruitmentForm && <div>Biểu mẫu: {(org.recruitmentForm as any).title}</div>}
        </div>
      )}

      {/* ── Buttons ── */}
      <div className="flex justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 flex-wrap mb-10 px-3">
        {!org?.isRecruiting ? (
          <button
            className="bg-[#08667a] text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-[#06505f] transition"
            onClick={handleOpenRecruitDialog}
          >
            Mở đơn đăng ký
          </button>
        ) : (
          <button
            className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-red-600 transition disabled:opacity-50"
            onClick={() => closeMut.mutate()}
            disabled={closeMut.isPending}
          >
            {closeMut.isPending ? "Đang đóng..." : "Đóng đơn đăng ký"}
          </button>
        )}

        <button
          className="bg-[#08667a] text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-[#06505f] transition"
          onClick={handleClickEditInfo}
        >
          Chỉnh sửa thông tin
        </button>

        {!isEditing ? (
          <button
            className="border border-[#08667a] text-[#08667a] px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-[#08667a] hover:text-white transition"
            onClick={() => setIsEditing(true)}
          >
            Chỉnh sửa ảnh
          </button>
        ) : (
          <button
            className="bg-teal-600 text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-teal-700 transition"
            onClick={() => setIsEditing(false)}
          >
            Xong chỉnh sửa ảnh
          </button>
        )}

        {org?.isRecruiting && (
          <button
            className="bg-[#1A73E8] text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-[#1557b0] transition"
            onClick={handleOpenUpdateDialog}
          >
            Cập nhật đơn đăng ký
          </button>
        )}
      </div>

      {/* ── Text / info edit dialog ── */}
      <OverlayDialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <h2 className="text-lg font-bold text-[#0E5C63] mb-4">Chỉnh sửa thông tin</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tổ chức</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Liên hệ</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Email liên hệ công khai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editTiktok}
              onChange={(e) => setEditTiktok(e.target.value)}
              placeholder="Link hoặc tên tài khoản TikTok"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editFacebook}
              onChange={(e) => setEditFacebook(e.target.value)}
              placeholder="Link Facebook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Số điện thoại liên hệ"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 rounded-lg border text-sm" onClick={() => setShowEditDialog(false)}>Hủy</button>
          <button
            className="px-4 py-2 rounded-lg bg-[#08667a] text-white text-sm disabled:opacity-50"
            disabled={editMut.isPending}
            onClick={() => editMut.mutate({
              organizationName: editName,
              description: editDesc,
              ...(editEmail ? { email: editEmail } : {}),
              ...(editTiktok ? { tiktokUrl: editTiktok } : { tiktokUrl: null }),
              ...(editFacebook ? { facebookUrl: editFacebook } : { facebookUrl: null }),
              ...(editPhone ? { phoneNumber: editPhone } : { phoneNumber: null }),
            })}
          >
            {editMut.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </OverlayDialog>

      {/* ── Recruitment dialogs ── */}
      <RecruitmentDialog
        open={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
        title="Mở đơn đăng ký"
        organizationId={org?.organizationId ?? 0}
        value={recForm}
        onChange={setRecForm}
        isPending={openMut.isPending}
        onSubmit={() => openMut.mutate(recForm)}
      />
      <RecruitmentDialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        title="Cập nhật đơn đăng ký"
        organizationId={org?.organizationId ?? 0}
        value={recForm}
        onChange={setRecForm}
        isPending={updateMut.isPending}
        onSubmit={() => updateMut.mutate(recForm)}
      />
    </div>
  )
}
