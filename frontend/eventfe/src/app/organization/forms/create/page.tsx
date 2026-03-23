"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { FormBuilder } from "@/components/form-builder/form-builder"
import { useCreateForm } from "@/hooks/useForm.hook"
import { getMyOrganization } from "@/services/organization.service"
import { updateActivity } from "@/services/activity.service"
import { toastSuccess, toastError } from "@/lib/toast"
import type { CreateFormPayload } from "@/types/form/form.types"

function OrgCreateFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activityId")
  const createMutation = useCreateForm()

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })
  const organizationId = orgData?.data?.organizationId

  const handleSave = async (data: CreateFormPayload) => {
    if (!organizationId) {
      toastError("Không tìm thấy thông tin tổ chức")
      return
    }
    try {
      const created = await createMutation.mutateAsync({
        ...data,
        organizationId,
        activityId: activityId ? Number(activityId) : undefined,
      }) as any
      const newFormId = created?.data?.formId ?? created?.formId
      // Auto-link the new form to the activity
      if (activityId && newFormId) {
        await updateActivity(activityId, { registrationFormId: newFormId })
      }
      toastSuccess("Tạo biểu mẫu thành công")
      if (activityId) {
        router.push(`/organization/event/${activityId}`)
      } else {
        router.push("/organization/forms")
      }
    } catch {
      toastError("Tạo biểu mẫu thất bại")
    }
  }

  return (
    <div className="px-[60px] py-8">
      <h1 className="text-xl font-bold text-[#0E5C63] mb-6">TẠO BIỂU MẪU MỚI</h1>
      {activityId && (
        <p className="text-sm text-teal-600 mb-4">
          Biểu mẫu sẽ được liên kết với sự kiện #{activityId} sau khi tạo.
        </p>
      )}
      <FormBuilder
        onSave={handleSave}
        isSaving={createMutation.isPending}
      />
    </div>
  )
}

export default function OrgCreateFormPage() {
  return (
    <Suspense>
      <OrgCreateFormContent />
    </Suspense>
  )
}
