"use client"

import { useRouter } from "next/navigation"
import { FormBuilder } from "@/components/form-builder/form-builder"
import { useCreateForm } from "@/hooks/useForm.hook"
import { toastSuccess, toastError } from "@/lib/toast"
import type { CreateFormPayload } from "@/types/form/form.types"

export default function CreateFormPage() {
  const router = useRouter()
  const createMutation = useCreateForm()

  const handleSave = async (data: CreateFormPayload) => {
    try {
      await createMutation.mutateAsync(data)
      toastSuccess("Tao form thanh cong")
      router.push("/admin/forms")
    } catch {
      toastError("Tao form that bai")
    }
  }

  return (
    <div className="@container/main p-4 lg:p-6">
      <h1 className="text-2xl font-bold mb-6">Tao form moi</h1>
      <FormBuilder onSave={handleSave} isSaving={createMutation.isPending} />
    </div>
  )
}
