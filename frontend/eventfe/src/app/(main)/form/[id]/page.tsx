"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useFormPublic, useSubmitForm } from "@/hooks/useForm.hook"
import { FormRenderer } from "@/components/form-builder/form-renderer"
import { Card, CardContent } from "@/components/ui/card"
import { toastSuccess, toastError } from "@/lib/toast"
import type { SubmitFormPayload } from "@/types/form/form.types"

export default function PublicFormPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: result, isLoading } = useFormPublic(params.id)
  const submitMutation = useSubmitForm(params.id)
  const [submitted, setSubmitted] = React.useState(false)

  const form = result?.data

  const handleSubmit = async (data: SubmitFormPayload) => {
    try {
      await submitMutation.mutateAsync(data)
      setSubmitted(true)
      toastSuccess("Nop form thanh cong!")
    } catch {
      toastError("Nop form that bai. Vui long thu lai.")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <p className="text-muted-foreground text-center">Dang tai form...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Form khong ton tai hoac da dong.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h2 className="text-xl font-semibold">Da nop form thanh cong!</h2>
            <p className="text-muted-foreground">
              Cam on ban da dien form. Phan hoi cua ban da duoc ghi nhan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <FormRenderer
        form={form}
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  )
}
