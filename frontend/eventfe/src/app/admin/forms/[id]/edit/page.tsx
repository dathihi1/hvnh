"use client"

import { useParams, useRouter } from "next/navigation"
import { FormBuilder } from "@/components/form-builder/form-builder"
import { useFormDetail, useUpdateForm } from "@/hooks/useForm.hook"
import { toastSuccess, toastError } from "@/lib/toast"
import type { CreateFormPayload } from "@/types/form/form.types"

export default function EditFormPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: result, isLoading } = useFormDetail(params.id)
  const updateMutation = useUpdateForm(params.id)

  const form = result?.data

  const handleSave = async (data: CreateFormPayload) => {
    try {
      await updateMutation.mutateAsync(data)
      toastSuccess("Cap nhat form thanh cong")
      router.push("/admin/forms")
    } catch {
      toastError("Cap nhat form that bai")
    }
  }

  if (isLoading) {
    return (
      <div className="@container/main p-4 lg:p-6">
        <p className="text-muted-foreground">Dang tai...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="@container/main p-4 lg:p-6">
        <p className="text-muted-foreground">Khong tim thay form</p>
      </div>
    )
  }

  const initialData: CreateFormPayload = {
    TenForm: form.TenForm,
    MoTa: form.MoTa,
    CauHinhForm: form.CauHinhForm,
    MaHoatDong: form.MaHoatDong,
    MaDot: form.MaDot,
    DanhSachPhan: form.phanForm.map((section) => ({
      TieuDe: section.TieuDe,
      MoTa: section.MoTa,
      ThuTu: section.ThuTu,
      DieuKienHienThi: section.DieuKienHienThi,
      DanhSachCauHoi: section.cauHoi.map((q) => ({
        NoiDung: q.NoiDung,
        MoTa: q.MoTa,
        LoaiCauHoi: q.LoaiCauHoi,
        ThuTu: q.ThuTu,
        BatBuoc: q.BatBuoc,
        TuyChon: q.TuyChon,
        QuyTacXacThuc: q.QuyTacXacThuc,
        DieuKienHienThi: q.DieuKienHienThi,
      })),
    })),
  }

  return (
    <div className="@container/main p-4 lg:p-6">
      <h1 className="text-2xl font-bold mb-6">Chinh sua form</h1>
      <FormBuilder
        initialData={initialData}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
      />
    </div>
  )
}
