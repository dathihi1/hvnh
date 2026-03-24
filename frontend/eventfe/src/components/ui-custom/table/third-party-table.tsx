"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react"
import {
  IconDotsVertical, IconLayoutColumns,
} from "@tabler/icons-react"
import {
  flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { envConfig } from "@/configs/env.config"
import { http } from "@/configs/http.comfig"

export const thirdPartySchema = z.object({
  id: z.number(),
  organizationId: z.number(),
  logoUrl: z.string().nullable().optional(),
  organizationName: z.string(),
  organizationType: z.string(),
  email: z.string().nullable().optional(),
  status: z.string().optional(),
})

type ThirdParty = z.infer<typeof thirdPartySchema>

function createThirdPartyColumns(
  onEdit: (org: ThirdParty) => void,
  onDelete: (org: ThirdParty) => void
): ColumnDef<ThirdParty>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "logoUrl",
      header: "Avatar",
      cell: ({ row }) => (
        <div className="w-[50px] h-[50px] rounded-full overflow-hidden">
          <img
            src={row.original.logoUrl || "/hinh-nen-may-tinh-anime.jpg"}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "organizationName",
      header: "Tên tổ chức",
      cell: ({ row }) => <span>{row.original.organizationName}</span>,
    },
    {
      accessorKey: "organizationType",
      header: "Loại",
      cell: () => (
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
          Bên thứ 3
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email ?? "-"}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>Xóa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function CreateThirdPartyDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    organizationName: "",
    email: "",
    description: "",
    leaderName: "",
    leaderEmail: "",
    leaderPassword: "",
    leaderUniversity: "",
    leaderPhoneNumber: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, string> = {
        organizationName: form.organizationName,
        organizationType: "organization", // always "organization" for third-party
        leaderName: form.leaderName,
        leaderEmail: form.leaderEmail,
        leaderPassword: form.leaderPassword,
        leaderUniversity: form.leaderUniversity,
      }
      if (form.email) body.email = form.email
      if (form.description) body.description = form.description
      if (form.leaderPhoneNumber) body.leaderPhoneNumber = form.leaderPhoneNumber

      const res = await http.post<{ success: boolean }>(
        `${envConfig.NEXT_PUBLIC_API_URL}/admin/organizations`,
        body
      ) as any
      if (!res?.success) throw new Error(res?.message || "Tạo thất bại")
      const leaderEmail = res?.data?.leader?.email || form.leaderEmail
      toast.success(`Tạo thành công! Tài khoản quản lý: ${leaderEmail}`)
      setOpen(false)
      setForm({
        organizationName: "", email: "", description: "",
        leaderName: "", leaderEmail: "", leaderPassword: "", leaderUniversity: "", leaderPhoneNumber: "",
      })
      onCreated?.()
    } catch (err: any) {
      toast.error(err?.message || "Tạo thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-10 px-4 flex items-center gap-1">
          <Plus className="size-4" /> Tạo mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo tổ chức bên thứ 3</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="tp-name">Tên tổ chức *</Label>
            <Input
              id="tp-name"
              value={form.organizationName}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tp-email">Email tổ chức</Label>
            <Input
              id="tp-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tp-desc">Mô tả</Label>
            <Input
              id="tp-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Leader account */}
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 p-4 mt-1">
            <p className="text-sm font-medium text-muted-foreground">Tài khoản quản lý (tạo tự động)</p>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tp-l-name">Họ và tên *</Label>
              <Input
                id="tp-l-name"
                value={form.leaderName}
                onChange={(e) => setForm((f) => ({ ...f, leaderName: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tp-l-email">Email đăng nhập *</Label>
              <Input
                id="tp-l-email"
                type="email"
                value={form.leaderEmail}
                onChange={(e) => setForm((f) => ({ ...f, leaderEmail: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tp-l-pass">Mật khẩu * (tối thiểu 8 ký tự)</Label>
              <Input
                id="tp-l-pass"
                type="password"
                value={form.leaderPassword}
                onChange={(e) => setForm((f) => ({ ...f, leaderPassword: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tp-l-uni">Trường / Đơn vị *</Label>
              <Input
                id="tp-l-uni"
                value={form.leaderUniversity}
                onChange={(e) => setForm((f) => ({ ...f, leaderUniversity: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tp-l-phone">Số điện thoại</Label>
              <Input
                id="tp-l-phone"
                value={form.leaderPhoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, leaderPhoneNumber: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ThirdPartyTable({
  data,
  onRefresh,
}: {
  data: ThirdParty[]
  onRefresh?: () => void
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const handleDelete = React.useCallback(async (org: ThirdParty) => {
    if (!confirm(`Xóa tổ chức "${org.organizationName}"?`)) return
    try {
      const res = await http.delete<{ success: boolean; message?: string }>(
        `${envConfig.NEXT_PUBLIC_API_URL}/admin/organizations/${org.organizationId}`,
        undefined
        )
      if (!res?.success) throw new Error(res?.message || "Xóa thất bại")
      toast.success("Xóa thành công")
      onRefresh?.()
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại")
    }
  }, [onRefresh])

  const handleEdit = (_org: ThirdParty) => {
    toast.info("Tính năng chỉnh sửa đang phát triển")
  }

  const columns = React.useMemo(() => createThirdPartyColumns(handleEdit, handleDelete), [handleDelete])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <Input
          placeholder="Tìm kiếm..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <CreateThirdPartyDialog onCreated={onRefresh} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Chưa có tổ chức bên thứ 3 nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto hidden h-8 lg:flex">
                <IconLayoutColumns />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Tổng {data.length} tổ chức
          </span>
        </div>
      </div>
    </div>
  )
}
