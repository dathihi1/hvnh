"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ImageUpload } from "@/components/ui-custom/ImageUpload"
import { getMyOrganization } from "@/services/organization.service"
import { getCategories, createActivity } from "@/services/activity.service"
import { getFormList } from "@/services/form.service"
import { uploadFileToS3 } from "@/services/upload.service"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"

const STEPS = [
  "Thông tin cơ bản",
  "Thời gian & địa điểm",
  "Hình thức đăng ký",
]

const CONFIG_BASE = `${envConfig.NEXT_PUBLIC_API_URL}/system-config`
const AUTO_APPROVE_KEY = "registration.auto_approve"

export default function CreateProgramPage() {
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Step 1
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    // Step 2
    startDate: "",
    endDate: "",
    deadline: "",
    location: "",
    categoryId: "",
    slotMode: "unlimited" as "limited" | "unlimited",
    quantity: "",
  })

  // Step 3
  const [formMode, setFormMode] = useState<"none" | "existing">("none")
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null)
  const [approvalMode, setApprovalMode] = useState<"manual" | "auto" | null>(null)

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["activity-categories"],
    queryFn: () => getCategories(),
  })

  const organizationId = orgData?.data?.organizationId

  const { data: formsData } = useQuery({
    queryKey: ["org-forms-for-activity", organizationId],
    queryFn: () => getFormList({ organizationId, limit: 50 }),
    enabled: !!organizationId && step === 3,
  })

  // Fetch current auto-approve config when on step 3
  const { data: autoApproveData } = useQuery({
    queryKey: ["auto-approve-config-create"],
    queryFn: () => http.get<{ success: boolean; data: { value: { enabled: boolean } } }>(
      `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`
    ),
    enabled: step === 3,
    // Pre-populate approvalMode from fetched config
    select: (data) => {
      const enabled = (data as any)?.data?.value?.enabled === true
      return enabled
    },
  })

  // Sync fetched config into local approvalMode (only once, if user hasn't chosen yet)
  const resolvedApprovalMode: "manual" | "auto" =
    approvalMode ?? (autoApproveData === true ? "auto" : "manual")

  const categories = (categoriesData as any)?.data ?? []
  const orgForms = (formsData as any)?.data?.data ?? []

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError("")
  }

  // ── Step navigation ──

  const goToStep2 = () => {
    if (!form.name.trim()) { setError("Vui lòng nhập tên chương trình!"); return }
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
    if (!organizationId) { setError("Không tìm thấy thông tin tổ chức!"); return }
    setSubmitting(true)
    setError("")
    try {
      // 1. Update approval mode config if user explicitly chose one
      if (approvalMode !== null) {
        const shouldAutoApprove = approvalMode === "auto"
        await http.put(
          `${CONFIG_BASE}/${AUTO_APPROVE_KEY}/my-org`,
          { value: { enabled: shouldAutoApprove } }
        )
      }

      // 2. Upload cover image
      let coverKey: string | null = null
      if (coverFile) {
        coverKey = await uploadFileToS3(coverFile, "covers")
        if (!coverKey) { setError("Upload ảnh thất bại, vui lòng thử lại!"); setSubmitting(false); return }
      }

      // 3. Create activity
      const res = await createActivity({
        activityName: form.name,
        description: form.description || null,
        coverImage: coverKey,
        location: form.location,
        activityType: "program",
        teamMode: "individual",
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.deadline).toISOString(),
        maxParticipants: form.slotMode === "limited" ? Number(form.quantity) : null,
        organizationId,
        categoryId: Number(form.categoryId),
        registrationFormId: formMode === "existing" ? selectedFormId : null,
      })
      if (res?.success) {
        setShowSuccess(true)
      } else {
        setError((res as any)?.error ?? "Tạo thất bại, vui lòng thử lại!")
      }
    } catch (e: any) {
      setError(e?.message ?? "Không thể kết nối máy chủ!")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mt-6">
      <h1 className="text-center text-xl font-semibold mb-4">TẠO MỚI CHƯƠNG TRÌNH</h1>

      {error && <div className="text-red-500 text-center mb-4 text-sm">{error}</div>}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  step === i + 1
                    ? "bg-teal-700 text-white"
                    : step > i + 1
                    ? "bg-teal-400 text-white"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span className={`text-xs ${step === i + 1 ? "text-teal-700 font-semibold" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-[2px] mb-5 mx-1 ${step > i + 1 ? "bg-teal-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Thông tin cơ bản ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium">Tên chương trình <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              placeholder="Nhập tên chương trình..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ảnh đại diện</label>
            <ImageUpload
              folder="covers"
              variant="cover"
              onFileChange={(file) => setCoverFile(file)}
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

      {/* ── Step 2: Thời gian, địa điểm, phân loại, số lượng ── */}
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

          {/* Phân loại */}
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

          {/* Số lượng */}
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

      {/* ── Step 3: Hình thức đăng ký + Xét duyệt ── */}
      {step === 3 && (
        <div className="space-y-6">

          {/* ── Hình thức xét duyệt ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Hình thức xét duyệt</p>
            <p className="text-xs text-gray-500 mb-3">
              Cài đặt này áp dụng cho tất cả chương trình của tổ chức.
            </p>

            <div className="space-y-2">
              {/* Manual */}
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                resolvedApprovalMode === "manual"
                  ? "border-teal-600 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300",
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tổ chức xem xét và duyệt từng đăng ký. Học viên chờ thông báo.
                  </p>
                </div>
              </label>

              {/* Auto-approve */}
              <label className={[
                "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                resolvedApprovalMode === "auto"
                  ? "border-teal-600 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300",
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ai đăng ký sẽ được duyệt ngay lập tức.
                    {form.slotMode === "limited"
                      ? " Khi hết chỗ, người đăng ký sau sẽ vào danh sách chờ."
                      : " Không giới hạn số lượng."}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Biểu mẫu đăng ký</p>
            <p className="text-xs text-gray-500 mb-3">
              Chọn hình thức thu thập thông tin khi học viên đăng ký.
            </p>

            {/* Không dùng form */}
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

              {/* Dùng form */}
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

            {/* Form list */}
            {formMode === "existing" && (
              <div className="ml-7 mt-3 space-y-3">
                {orgForms.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">
                    Tổ chức chưa có biểu mẫu nào.{" "}
                    <a href="/organization/forms/create" target="_blank" className="text-teal-600 underline">
                      Tạo biểu mẫu mới
                    </a>
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Chọn biểu mẫu:</p>
                      <a href="/organization/forms/create" target="_blank" className="text-xs text-teal-600 underline">
                        + Tạo mới
                      </a>
                    </div>
                    {orgForms.map((f: any) => (
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
                              f.status === "open" ? "bg-green-100 text-green-700" :
                              f.status === "closed" ? "bg-red-100 text-red-600" :
                              "bg-gray-100 text-gray-500"
                            ].join(" ")}>
                              {f.status === "open" ? "Đang mở" : f.status === "closed" ? "Đã đóng" : "Bản nháp"}
                            </span>
                          </div>
                          {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Bạn có thể thay đổi cài đặt này sau khi tạo chương trình.
          </p>

          <div className="flex justify-between mt-4">
            <button onClick={() => { setStep(2); setError("") }} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
              ← Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (formMode === "existing" && !selectedFormId && orgForms.length > 0)}
              className="bg-teal-700 text-white px-5 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Đang tạo..." : "Tạo chương trình"}
            </button>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[320px] text-center shadow-lg">
            <div className="text-green-500 text-4xl mb-3">✓</div>
            <h2 className="font-semibold mb-2">Tạo mới thành công!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Chương trình đã được ghi nhận vào hệ thống.
            </p>
            <button
              onClick={() => router.push("/organization/event")}
              className="bg-teal-700 text-white px-4 py-2 rounded text-sm"
            >
              Xem danh sách
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
