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
import type { MauForm, TrangThaiForm } from "@/types/form/form.types"

const STATUS_MAP: Record<TrangThaiForm, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NHAP: { label: "Nhap", variant: "secondary" },
  DANG_MO: { label: "Dang mo", variant: "default" },
  DA_DONG: { label: "Da dong", variant: "destructive" },
}

export default function FormsListPage() {
  const [page, setPage] = React.useState(1)
  const { data: result, isLoading } = useFormList({ page, limit: 20 })
  const deleteMutation = useDeleteForm()
  const queryClient = useQueryClient()

  const forms = result?.data?.data || []
  const meta = result?.data?.meta

  const handleDelete = async (id: string) => {
    if (!confirm("Ban co chac muon xoa form nay?")) return
    try {
      await deleteMutation.mutateAsync(id)
      toastSuccess("Xoa form thanh cong")
    } catch {
      toastError("Xoa form that bai")
    }
  }

  const handleChangeStatus = async (id: string, status: TrangThaiForm) => {
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
        {forms.map((form: MauForm) => {
          const status = STATUS_MAP[form.TrangThai] || STATUS_MAP.NHAP
          return (
            <Card key={form.MaForm}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{form.TenForm}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.TrangThai === "NHAP" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.MaForm, "DANG_MO")}
                      >
                        <IconPlayerPlay className="size-4 mr-1" /> Mo form
                      </Button>
                    )}
                    {form.TrangThai === "DANG_MO" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.MaForm, "DA_DONG")}
                      >
                        <IconPlayerStop className="size-4 mr-1" /> Dong form
                      </Button>
                    )}
                    <Link href={`/admin/forms/${form.MaForm}/responses`}>
                      <Button variant="outline" size="sm">
                        <IconFileSpreadsheet className="size-4 mr-1" /> Phan hoi ({form._count?.phanHoiForm || 0})
                      </Button>
                    </Link>
                    <Link href={`/admin/forms/${form.MaForm}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(form.MaForm)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {form.MoTa && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{form.MoTa}</p>
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
