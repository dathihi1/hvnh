"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useFormDetail, useFormResponses, useApproveResponse } from "@/hooks/useForm.hook"
import { exportGoogleSheets } from "@/services/form.service"
import { envConfig } from "@/configs/env.config"
import { ResponseTable } from "@/components/form-builder/response-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconArrowLeft,
  IconFileSpreadsheet,
  IconBrandGoogleDrive,
} from "@tabler/icons-react"
import { toastSuccess, toastError } from "@/lib/toast"
import type { PhanHoiForm } from "@/types/form/form.types"

export default function ResponsesPage() {
  const params = useParams<{ id: string }>()
  const [page, setPage] = React.useState(1)
  const [selectedResponse, setSelectedResponse] = React.useState<PhanHoiForm | null>(null)

  const { data: formResult } = useFormDetail(params.id)
  const { data: responsesResult, isLoading } = useFormResponses({
    id: params.id,
    page,
    limit: 20,
  })
  const approveMutation = useApproveResponse(params.id)

  const form = formResult?.data
  const responses = responsesResult?.data?.data || []
  const meta = responsesResult?.data?.meta

  const handleApprove = async (responseId: string, status: "DA_DUYET" | "TU_CHOI") => {
    try {
      await approveMutation.mutateAsync({ responseId, TrangThai: status })
      toastSuccess(status === "DA_DUYET" ? "Da duyet phan hoi" : "Da tu choi phan hoi")
    } catch {
      toastError("Thao tac that bai")
    }
  }

  const handleExportExcel = () => {
    const url = `${envConfig.NEXT_PUBLIC_API_URL}/mau-form/${params.id}/export/excel`
    window.open(url, "_blank")
  }

  const handleExportGoogleSheets = async () => {
    try {
      const result = await exportGoogleSheets(params.id)
      if (result?.data?.spreadsheetUrl) {
        window.open(result.data.spreadsheetUrl, "_blank")
        toastSuccess("Da tao Google Sheet")
      }
    } catch {
      toastError("Xuat Google Sheets that bai")
    }
  }

  return (
    <div className="@container/main p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/forms">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Phan hoi</h1>
            {form && <p className="text-sm text-muted-foreground">{form.TenForm}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <IconFileSpreadsheet className="size-4 mr-1" /> Xuat Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportGoogleSheets}>
            <IconBrandGoogleDrive className="size-4 mr-1" /> Google Sheets
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground p-6">Dang tai...</p>
          ) : (
            <ResponseTable
              responses={responses}
              onApprove={handleApprove}
              onViewDetail={(r) => setSelectedResponse(r)}
            />
          )}
        </CardContent>
      </Card>

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

      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiet phan hoi</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="font-medium">Nguoi nop:</span>{" "}
                {selectedResponse.nguoiDung?.TenNguoiDung || selectedResponse.MaNguoiDung}
              </div>
              <div className="text-sm">
                <span className="font-medium">Thoi gian:</span>{" "}
                {new Date(selectedResponse.ThoiGianNop).toLocaleString("vi-VN")}
              </div>
              <div className="border-t pt-4 space-y-3">
                {selectedResponse.cauTraLoi.map((answer) => (
                  <div key={answer.MaCauTraLoi} className="space-y-1">
                    <p className="text-sm font-medium">
                      {answer.cauHoi?.NoiDung || answer.MaCauHoi}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {answer.GiaTriNhieu
                        ? answer.GiaTriNhieu.join(", ")
                        : answer.GiaTri || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
