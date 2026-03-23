"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useFormList, useDeleteForm } from "@/hooks/useForm.hook"
import { changeFormStatus } from "@/services/form.service"
import { getMyOrganization } from "@/services/organization.service"
import { useDebounce } from "@/hooks/useDebounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFileSpreadsheet,
  IconPlayerPlay,
  IconPlayerStop,
  IconSearch,
  IconTag,
} from "@tabler/icons-react"
import { toastSuccess, toastError } from "@/lib/toast"
import type { Form, FormStatus } from "@/types/form/form.types"

const STATUS_MAP: Record<FormStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Bản nháp", variant: "secondary" },
  open: { label: "Đang mở", variant: "default" },
  closed: { label: "Đã đóng", variant: "destructive" },
}

function FormContextBadge({ form }: { form: Form }) {
  if (form.activityId) {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
        <IconTag className="size-3 mr-1" />
        Sự kiện #{form.activityId}
      </Badge>
    )
  }
  if (form.organizationId) {
    return (
      <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 text-xs">
        <IconTag className="size-3 mr-1" />
        Tuyển thành viên
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
      Biểu mẫu độc lập
    </Badge>
  )
}

export default function OrgFormsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<FormStatus | "">("")
  const debouncedSearch = useDebounce(search, 400)

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })
  const organizationId = orgData?.data?.organizationId

  const { data: result, isLoading } = useFormList({
    page,
    limit: 20,
    organizationId,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  })
  const deleteMutation = useDeleteForm()

  const forms: Form[] = result?.data?.data ?? []
  const meta = result?.data?.meta

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handleStatusChange = (val: string) => {
    setStatusFilter(val as FormStatus | "")
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa biểu mẫu này?")) return
    try {
      await deleteMutation.mutateAsync(id)
      toastSuccess("Đã xóa biểu mẫu")
    } catch {
      toastError("Xóa thất bại")
    }
  }

  const handleChangeStatus = async (id: number, status: FormStatus) => {
    try {
      await changeFormStatus(id, status)
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      toastSuccess("Cập nhật trạng thái thành công")
    } catch {
      toastError("Cập nhật thất bại")
    }
  }

  return (
    <div className="px-[60px] py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#0E5C63]">QUẢN LÝ BIỂU MẪU</h1>
        <Link href="/organization/forms/create">
          <Button className="bg-[#0E5C63] hover:bg-[#0a4a50]">
            <IconPlus className="size-4 mr-2" /> Tạo biểu mẫu mới
          </Button>
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề..."
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#0E5C63]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#0E5C63]/30 bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="open">Đang mở</option>
          <option value="closed">Đã đóng</option>
        </select>

        {(search || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setStatusFilter(""); setPage(1) }}
            className="text-muted-foreground"
          >
            Xóa bộ lọc
          </Button>
        )}

        {meta && (
          <span className="text-sm text-muted-foreground ml-auto">
            {meta.total} biểu mẫu
          </span>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      {!isLoading && forms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || statusFilter
              ? "Không tìm thấy biểu mẫu phù hợp."
              : "Chưa có biểu mẫu nào. Nhấn \"Tạo biểu mẫu mới\" để bắt đầu."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {forms.map((form) => {
          const statusInfo = STATUS_MAP[form.status] ?? STATUS_MAP.draft
          return (
            <Card key={form.formId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{form.title}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      <FormContextBadge form={form} />
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{form.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tạo lúc {new Date(form.createdAt).toLocaleDateString("vi-VN")}
                      {form.openAt && ` · Mở: ${new Date(form.openAt).toLocaleDateString("vi-VN")}`}
                      {form.closeAt && ` · Đóng: ${new Date(form.closeAt).toLocaleDateString("vi-VN")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {form.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.formId, "open")}
                      >
                        <IconPlayerPlay className="size-4 mr-1" /> Mở
                      </Button>
                    )}
                    {form.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(form.formId, "closed")}
                      >
                        <IconPlayerStop className="size-4 mr-1" /> Đóng
                      </Button>
                    )}
                    <Link href={`/organization/forms/${form.formId}/responses`}>
                      <Button variant="outline" size="sm">
                        <IconFileSpreadsheet className="size-4 mr-1" />
                        Phản hồi ({form._count?.responses ?? 0})
                      </Button>
                    </Link>
                    <Link href={`/organization/forms/${form.formId}/edit`}>
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
            </Card>
          )
        })}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
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
