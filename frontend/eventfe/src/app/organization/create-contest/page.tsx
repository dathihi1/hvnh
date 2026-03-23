"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ImageUpload } from "@/components/ui-custom/ImageUpload"
import { getMyOrganization } from "@/services/organization.service"
import { getCategories, createActivity } from "@/services/activity.service"
import { getFormList } from "@/services/form.service"
import { uploadFileToS3 } from "@/services/upload.service"

const STEPS = [
  "Thông tin cơ bản",
  "Thời gian & địa điểm",
  "Form đăng ký",
]

export default function CreateContestPage() {
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
    teamMode: "individual" as "individual" | "team",
    minTeam: "",
    maxTeam: "",
  })

  // Step 3
  const [formMode, setFormMode] = useState<"none" | "existing">("none")
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null)

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

  const allCategories = categoriesData?.data ?? []
  const categories = allCategories.filter((cat) =>
    ["Học thuật", "Phi học thuật"].includes(cat.categoryName)
  )
  const orgForms = (formsData as any)?.data?.data ?? []

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError("")
  }

  // ── Step navigation ──

  const goToStep2 = () => {
    if (!form.name.trim()) { setError("Vui lòng nhập tên cuộc thi!"); return }
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
    if (form.teamMode === "team") {
      const min = Number(form.minTeam)
      const max = Number(form.maxTeam)
      if (!form.minTeam || !form.maxTeam || isNaN(min) || isNaN(max) || min < 1 || max < 1) {
        setError("Vui lòng nhập số lượng thành viên nhóm hợp lệ!"); return
      }
      if (min > max) {
        setError("Số thành viên tối thiểu không được lớn hơn tối đa!"); return
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
      let coverKey: string | null = null
      if (coverFile) {
        coverKey = await uploadFileToS3(coverFile, "covers")
        if (!coverKey) { setError("Upload ảnh thất bại, vui lòng thử lại!"); setSubmitting(false); return }
      }
      const payload: Parameters<typeof createActivity>[0] = {
        activityName: form.name,
        description: form.description || null,
        coverImage: coverKey,
        location: form.location,
        activityType: "competition",
        teamMode: form.teamMode,
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.deadline).toISOString(),
        maxParticipants: null,
        organizationId,
        categoryId: Number(form.categoryId),
        registrationFormId: formMode === "existing" ? selectedFormId : null,
        teamRule: form.teamMode === "team" ? {
          minTeamMembers: Number(form.minTeam),
          maxTeamMembers: Number(form.maxTeam),
        } : null,
      }
      const res = await createActivity(payload)
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
      <h1 className="text-center text-xl font-semibold mb-4">TẠO MỚI CUỘC THI</h1>

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
            <label className="text-sm font-medium">Tên cuộc thi <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:outline-none focus:border-teal-600"
              placeholder="Nhập tên cuộc thi..."
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
              placeholder="Mô tả cuộc thi..."
            />
          </div>
          <div className="flex justify-end">
            <button onClick={goToStep2} className="bg-teal-700 text-white px-5 py-2 rounded text-sm font-medium">
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Thời gian, địa điểm, phân loại, hình thức thi ── */}
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
              {categories.map((cat) => (
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

          {/* Hình thức thi */}
          <div>
            <label className="text-sm font-medium">Hình thức thi <span className="text-red-500">*</span></label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teamMode"
                  checked={form.teamMode === "individual"}
                  onChange={() => setForm((p) => ({ ...p, teamMode: "individual", minTeam: "", maxTeam: "" }))}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="text-sm">Cá nhân</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teamMode"
                  checked={form.teamMode === "team"}
                  onChange={() => setForm((p) => ({ ...p, teamMode: "team" }))}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="text-sm">Nhóm</span>
              </label>
            </div>

            {form.teamMode === "team" && (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Thành viên tối thiểu:</label>
                  <input
                    type="number"
                    min={1}
                    value={form.minTeam}
                    onChange={(e) => handleChange("minTeam", e.target.value)}
                    className="border border-gray-300 p-2 rounded text-sm w-[90px] focus:outline-none focus:border-teal-600"
                    placeholder="VD: 2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Tối đa:</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxTeam}
                    onChange={(e) => handleChange("maxTeam", e.target.value)}
                    className="border border-gray-300 p-2 rounded text-sm w-[90px] focus:outline-none focus:border-teal-600"
                    placeholder="VD: 5"
                  />
                </div>
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

      {/* ── Step 3: Hình thức đăng ký ── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">
            Chọn hình thức đăng ký cho cuộc thi.
          </p>

          {/* Không dùng form */}
          <label
            className={[
              "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
              formMode === "none" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
            ].join(" ")}
          >
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
          <label
            className={[
              "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
              formMode === "existing" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300",
            ].join(" ")}
          >
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

          {/* Form list */}
          {formMode === "existing" && (
            <div className="ml-7 space-y-3">
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

          <p className="text-xs text-gray-400 pt-1">
            Bạn có thể thay đổi biểu mẫu đăng ký sau khi tạo hoạt động.
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
              {submitting ? "Đang tạo..." : "Tạo cuộc thi"}
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
              Cuộc thi đã được ghi nhận vào hệ thống.
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
