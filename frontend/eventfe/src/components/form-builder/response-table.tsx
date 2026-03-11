"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconCheck, IconX, IconEye } from "@tabler/icons-react"
import type { PhanHoiForm, TrangThaiPhanHoi } from "@/types/form/form.types"

const STATUS_MAP: Record<TrangThaiPhanHoi, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NHAP: { label: "Nhap", variant: "outline" },
  DA_NOP: { label: "Da nop", variant: "secondary" },
  DA_DUYET: { label: "Da duyet", variant: "default" },
  TU_CHOI: { label: "Tu choi", variant: "destructive" },
}

interface ResponseTableProps {
  responses: PhanHoiForm[]
  onApprove?: (responseId: string, status: "DA_DUYET" | "TU_CHOI") => void
  onViewDetail?: (response: PhanHoiForm) => void
}

export function ResponseTable({ responses, onApprove, onViewDetail }: ResponseTableProps) {
  if (responses.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Chua co phan hoi nao.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">STT</TableHead>
          <TableHead>Nguoi nop</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Thoi gian nop</TableHead>
          <TableHead>Trang thai</TableHead>
          <TableHead className="text-right">Thao tac</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.map((response, index) => {
          const status = STATUS_MAP[response.TrangThai] || STATUS_MAP.DA_NOP
          return (
            <TableRow key={response.MaPhanHoi}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {response.nguoiDung?.TenNguoiDung || response.MaNguoiDung}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {response.nguoiDung?.Email || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(response.ThoiGianNop).toLocaleString("vi-VN")}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {onViewDetail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(response)}
                    >
                      <IconEye className="size-4" />
                    </Button>
                  )}
                  {onApprove && response.TrangThai === "DA_NOP" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => onApprove(response.MaPhanHoi, "DA_DUYET")}
                      >
                        <IconCheck className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onApprove(response.MaPhanHoi, "TU_CHOI")}
                      >
                        <IconX className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
