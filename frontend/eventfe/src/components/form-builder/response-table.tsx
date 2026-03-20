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
import type { FormResponse, ResponseStatus } from "@/types/form/form.types"

const STATUS_MAP: Record<ResponseStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "Da nop", variant: "secondary" },
  approved: { label: "Da duyet", variant: "default" },
  rejected: { label: "Tu choi", variant: "destructive" },
}

interface ResponseTableProps {
  responses: FormResponse[]
  onApprove?: (responseId: number, status: "approved" | "rejected") => void
  onViewDetail?: (response: FormResponse) => void
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
          const status = STATUS_MAP[response.status] ?? STATUS_MAP.submitted
          return (
            <TableRow key={response.responseId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {response.user?.userName ?? response.userId ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {response.user?.email ?? response.respondentEmail ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(response.submittedAt).toLocaleString("vi-VN")}
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
                  {onApprove && response.status === "submitted" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => onApprove(response.responseId, "approved")}
                      >
                        <IconCheck className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onApprove(response.responseId, "rejected")}
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
