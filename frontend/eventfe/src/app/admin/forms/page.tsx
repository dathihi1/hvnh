"use client"

import * as React from "react"
import Link from "next/link"
import { useFormList, useDeleteForm } from "@/hooks/useForm.hook"
import { changeFormStatus } from "@/services/form.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFileSpreadsheet,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react"
import { toastSuccess, toastError } from "@/lib/toast"
import { useQueryClient } from "@tanstack/react-query"
import type { Form, FormStatus } from "@/types/form/form.types"

const STATUS_MAP: Record<FormStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nhap", variant: "secondary" },
  open: { label: "Dang mo", variant: "default" },
  closed: { label: "Da dong", variant: "destructive" },
}

export default function FormsListPage() {
  const [page, setPage] = React.useState(1)
  const { data: result, isLoading } = useFormList({ page, limit: 20 })
  const deleteMutation = useDeleteForm()
  const queryClient = useQueryClient()

  const forms: Form[] = result?.data?.data ?? []
  const meta = result?.data?.meta

  const handleDelete = async (id: number) => {
    if (!confirm("Ban co chac muon xoa form nay?")) return
    try {
      await deleteMutation.mutateAsync(id)
      toastSuccess("Xoa form thanh cong")
    } catch {
      toastError("Xoa form that bai")
    }
  }

  const handleChangeStatus = async (id: number, status: FormStatus) => {
    try {
      await changeFormStatus(id, status)
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      toastSuccess("Cap nhat trang thai thanh cong")
    } catch {
      toastError("Cap nhat trang thai that bai")
    }
  }

  return (
    <div className="@container/main p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quan ly Form</h1>
        <Link href="/admin/forms/create">
          <Button>
            <IconPlus className="size-4 mr-2" /> Tao form moi
          </Button>
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground">Dang tai...</p>}

      {!isLoading && forms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chua co form nao. Bam &quot;Tao form moi&quot; de bat dau.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {forms.map((form) => {
          const statusInfo = STATUS_MAP[form.status] ?? STATUS_MAP.draft
          return (
            <Card key={form.formId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {form.organization ? (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {form.organization.organizationName}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.formId, "open")}
                      >
                        <IconPlayerPlay className="size-4 mr-1" /> Mo form
                      </Button>
                    )}
                    {form.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.formId, "closed")}
                      >
                        <IconPlayerStop className="size-4 mr-1" /> Dong form
                      </Button>
                    )}
                    <Link href={`/admin/forms/${form.formId}/responses`}>
                      <Button variant="outline" size="sm">
                        <IconFileSpreadsheet className="size-4 mr-1" /> Phan hoi ({form._count?.responses ?? 0})
                      </Button>
                    </Link>
                    <Link href={`/admin/forms/${form.formId}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(form.formId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {form.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Truoc
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
