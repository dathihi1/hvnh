"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ImageUpload } from "@/components/ui-custom/ImageUpload"
import { getActivityById, updateActivity, getCategories } from "@/services/activity.service"
import { getFormList } from "@/services/form.service"
import { uploadFileToS3 } from "@/services/upload.service"
import { getMyOrganization } from "@/services/organization.service"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"
import { toast } from "sonner"
import Link from "next/link"

const CONFIG_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/system-config`
const AUTO_APPROVE_KEY = "registration.auto_approve"

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const activityId = Number(id)

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fetchError] = useState("")

  // Cover file (new upload)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  // Cover key to keep (existing or new)
  const [coverKey, setCoverKey] = useState<string | null>(null)

  const [form, setForm] = useState({
    activityName: "",
    description: "",
    startDate: "",
    endDate: "",
    deadline: "",
    location: "",
    categoryId: "",
    slotMode: "unlimited" as "limited" | "unlimited",
    quantity: "",
    activityType: "program",
    teamMode: "individual" as "individual" | "team",
  })

  const [formMode, setFormMode] = useState<"none" | "existing">("none")
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null)
  const [approvalMode, setApprovalMode] = useState<"manual" | "auto" | null>(null)

  // Fetch activity data
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ["activity", activityId],
    queryFn: () => getActivityById(activityId),
    enabled: !isNaN(activityId),
  })

  const activity = (activityData as any)?.data

  // Fetch org + categories + forms
  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })
  const organizationId = orgData?.data?.organizationId

  const { data: categoriesData } = useQuery({
    queryKey: ["activity-categories"],
    queryFn: () => getCategories(),
  })

  const { data: formsData } = useQuery({
    queryKey: ["org-forms-for-activity", organizationId],
    queryFn: () => getFormList({ organizationId, limit: 50 }),
    enabled: !!organizationId && step === 3,
  })

  // Fetch auto-approve config
  const { data: autoApproveData } = useQuery({
    queryKey: ["auto-approve-config-edit"],
    queryFn: () => http.get<{ success: boolean; data: { value: { enabled: boolean } } }>(
      `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`
    ),
    enabled: step === 3,
    select: (data: unknown) => {
      const d = data as { data?: { value?: { enabled?: boolean } } }
      return d?.data?.value?.enabled === true
    },
  })

  // Populate form when activity loads
  useEffect(() => {
    if (!activity) return
    const a = activity
    setForm({
      activityName: a.activityName ?? "",
      description: a.description ?? "",
      startDate: a.startTime ? new Date(a.startTime).toISOString().slice(0, 16) : "",
      endDate: a.endTime ? new Date(a.endTime).toISOString().slice(0, 16) : "",
      deadline: a.registrationDeadline ? new Date(a.registrationDeadline).toISOString().slice(0, 16) : "",
      location: a.location ?? "",
      categoryId: a.category?.categoryId ? String(a.category.categoryId) : "",
      slotMode: a.maxParticipants != null ? "limited" : "unlimited",
      quantity: a.maxParticipants != null ? String(a.maxParticipants) : "",
      activityType: a.activityType ?? "program",
      teamMode: a.teamMode ?? "individual",
    })
    setCoverKey(a.coverImage ?? null)
    setFormMode(a.registrationFormId ? "existing" : "none")
    setSelectedFormId(a.registrationFormId ?? null)
  }, [activity])

  const categories = (categoriesData as any)?.data ?? []
  const orgForms = (formsData as any)?.data?.data ?? []
  const resolvedApprovalMode: "manual" | "auto" =
    approvalMode ?? (autoApproveData === true ? "auto" : "manual")

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError("")
  }

  const goToStep2 = () => {
    if (!form.activityName.trim()) { setError("Vui lòng nhập tên chương trình!"); return }
    setError("")
    setStep(2)
  }

  const goToStep3 = () => {
    if (!form.startDate || !form.endDate || !form.deadline || !form.location.trim()) {
      setError("Vui lòng điền đầy đủ thông tin!"); return
    }
    if (!form.categoryId) { setError("Vui lòng chọn phân loại!"); return }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError("Thời gian bắt đầu phải trước thời gian kết thúc!"); return
    }
    if (new Date(form.deadline) > new Date(form.startDate)) {
      setError("Hạn đăng ký phải trước ngày bắt đầu!"); return
    }
    if (form.slotMode === "limited") {
      if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1) {
        setError("Vui lòng nhập số lượng tham gia hợp lệ!"); return
      }
    }
    setError("")
    setStep(3)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      // 1. Update approval mode config
      if (approvalMode !== null) {
        const shouldAutoApprove = approvalMode === "auto"
        await http.put(
          `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`,
          { value: { enabled: shouldAutoApprove } }
        )
      }

      // 2. Upload new cover if changed
      if (coverFile) {
        const key = await uploadFileToS3(coverFile, "covers")
        if (!key) { setError("Upload ảnh thất bại, vui lòng thử lại!"); setSubmitting(false); return }
        setCoverKey(key)
        // Update the activity with new cover
        await updateActivity(activityId, { coverImage: key })
      }

      // 3. Update activity fields
      const res = await updateActivity(activityId, {
        activityName: form.activityName,
        description: form.description || null,
        location: form.location,
        activityType: form.activityType as "program" | "competition" | "recruitment",
        teamMode: form.teamMode as "individual" | "team",
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.deadline).toISOString(),
        maxParticipants: form.slotMode === "limited" ? Number(form.quantity) : null,
        categoryId: Number(form.categoryId),
        registrationFormId: formMode === "existing" ? selectedFormId : null,
      })

      if (res?.success) {
        toast.success("Cập nhật thành công!")
        router.push(`/organization/event/${activityId}`)
      } else {
        setError((res as any)?.error ?? "Cập nhật thất bại!")
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Không thể kết nối máy chủ!")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingActivity) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Đang tải...
      </div>
    )
  }

  if (fetchError || (!loadingActivity && !activity)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{fetchError || "Không tìm thấy chương trình!"}</p>
        <Link href="/organization/event" className="text-blue-600 underline">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">CHỈNH SỬA CHƯƠNG TRÌNH</h1>
        <Link
          href={`/organization/event/${activityId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Quay lại
        </Link>
      </div>

      {error && <div className="text-red-500 text-center mb-4 text-sm">{error}</div>}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  step === i ? "bg-teal-700 text-white"
                    : step > i ? "bg-teal-400 text-white"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                {i}
              </span>
              <span className={`text-xs ${step === i ? "text-teal-700 font-semibold" : "text-gray-400"}`}>
                {i === 1 ? "Thông tin cơ bản" : i === 2 ? "Thời gian & địa điểm" : "Đăng ký"}
              </span>
            </div>
            {i < 3 && (
              <div className={`w-16 h-[2px] mb-5 mx-1 ${step > i ? "bg-teal-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium">Tên chương trình <span className="text-red-500">*</span></label>
            <input
              value={form.activityName}
              onChange={(e) => handleChange("activityName", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              placeholder="Nhập tên chương trình..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ảnh đại diện</label>
            <ImageUpload
              folder="covers"
              variant="cover"
              onFileChange={(file) => {
                setCoverFile(file)
                // If new file selected, clear existing key until saved
                if (file) setCoverKey(null)
              }}
              currentImageUrl={coverKey ? `${envConfig.NEXT_PUBLIC_API_URL}/uploads/${coverKey}` : undefined}
              className="mt-2 max-w-[300px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              rows={4}
              placeholder="Mô tả chương trình..."
            />
          </div>
          <div className="flex justify-end">
            <button onClick={goToStep2} className="bg-teal-700 text-white px-5 py-2 rounded text-sm font-medium">
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Thời gian bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Thời gian kết thúc <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Hạn đăng ký <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => handleChange("deadline", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Địa điểm <span className="text-red-500">*</span></label>
            <input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              placeholder="Nhập địa điểm tổ chức..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phân loại <span className="text-red-500">*</span></label>
            <div className="flex gap-6 mt-2">
              {categories.map((cat: any) => (
                <label key={cat.categoryId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={String(cat.categoryId)}
                    checked={form.categoryId === String(cat.categoryId)}
                    onChange={(e) => handleChange("categoryId", e.target.value)}
                    className="w-4 h-4 accent-teal-700"
                  />
                  <span className="text-sm">{cat.categoryName}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Số lượng tham gia</label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="slotMode"
                  checked={form.slotMode === "unlimited"}
                  onChange={() => setForm((p) => ({ ...p, slotMode: "unlimited", quantity: "" }))}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="text-sm">Không giới hạn</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="slotMode"
                  checked={form.slotMode === "limited"}
                  onChange={() => setForm((p) => ({ ...p, slotMode: "limited" }))}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="text-sm">Giới hạn</span>
              </label>
            </div>
            {form.slotMode === "limited" && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm text-gray-600">Số lượng tối đa:</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  className="border border-gray-300 p-2 rounded text-sm w-[120px] focus:outline-none focus:border-teal-600"
                  placeholder="Nhập số..."
                />
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={() => { setStep(1); setError("") }} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
              ← Quay lại
            </button>
            <button onClick={goToStep3} className="bg-teal-700 text-white px-5 py-2 rounded text-sm font-medium">
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Hình thức xét duyệt */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Hình thức xét duyệt</p>
            <p className="text-xs text-gray-500 mb-3">
              Cài đặt này áp dụng cho tất cả chương trình của tổ chức.
            </p>
            <div className="space-y-2">
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                resolvedApprovalMode === "manual" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
              ].join(" ")}>
                <input
                  type="radio"
                  name="approval-mode"
                  checked={resolvedApprovalMode === "manual"}
                  onChange={() => setApprovalMode("manual")}
                  className="mt-0.5 accent-teal-700"
                />
                <div>
                  <p className="font-medium text-sm">Xét duyệt thủ công</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tổ chức xem xét và duyệt từng đăng ký. Học viên chờ thông báo.</p>
                </div>
              </label>
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                resolvedApprovalMode === "auto" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
              ].join(" ")}>
                <input
                  type="radio"
                  name="approval-mode"
                  checked={resolvedApprovalMode === "auto"}
                  onChange={() => setApprovalMode("auto")}
                  className="mt-0.5 accent-teal-700"
                />
                <div>
                  <p className="font-medium text-sm">Tự động duyệt</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ai đăng ký sẽ được duyệt ngay lập tức.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Biểu mẫu đăng ký */}
          <div className="border-t pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Biểu mẫu đăng ký</p>
            <div className="space-y-2">
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                formMode === "none" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
              ].join(" ")}>
                <input
                  type="radio"
                  name="form-mode"
                  checked={formMode === "none"}
                  onChange={() => { setFormMode("none"); setSelectedFormId(null) }}
                  className="mt-0.5 accent-teal-700"
                />
                <div>
                  <p className="font-medium text-sm">Không sử dụng biểu mẫu</p>
                  <p className="text-xs text-gray-500 mt-0.5">Người dùng đăng ký trực tiếp, không cần điền thêm thông tin.</p>
                </div>
              </label>
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                formMode === "existing" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
              ].join(" ")}>
                <input
                  type="radio"
                  name="form-mode"
                  checked={formMode === "existing"}
                  onChange={() => setFormMode("existing")}
                  className="mt-0.5 accent-teal-700"
                />
                <div>
                  <p className="font-medium text-sm">Sử dụng biểu mẫu</p>
                  <p className="text-xs text-gray-500 mt-0.5">Người dùng phải điền biểu mẫu khi đăng ký.</p>
                </div>
              </label>
            </div>

            {formMode === "existing" && (
              <div className="ml-7 mt-3 space-y-3">
                {orgForms.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">
                    Tổ chức chưa có biểu mẫu nào.{" "}
                    <a href="/organization/forms/create" target="_blank" className="text-teal-600 underline">Tạo biểu mẫu mới</a>
                  </p>
                ) : (
                  orgForms.map((f: any) => (
                    <label
                      key={f.formId}
                      className={[
                        "flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors",
                        selectedFormId === f.formId ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="selected-form"
                        checked={selectedFormId === f.formId}
                        onChange={() => setSelectedFormId(f.formId)}
                        className="mt-0.5 accent-teal-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{f.title}</p>
                          <span className={[
                            "text-xs px-1.5 py-0.5 rounded-full",
                            f.status === "open" ? "bg-green-100 text-green-700"
                              : f.status === "closed" ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-500",
                          ].join(" ")}>
                            {f.status === "open" ? "Đang mở" : f.status === "closed" ? "Đã đóng" : "Bản nháp"}
                          </span>
                        </div>
                        {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => { setStep(2); setError("") }} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
              ← Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (formMode === "existing" && !selectedFormId && orgForms.length > 0)}
              className="bg-teal-700 text-white px-5 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
