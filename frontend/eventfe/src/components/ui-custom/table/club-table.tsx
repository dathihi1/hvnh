"use client"
import * as React from "react"
import {
  closestCenter, DndContext, KeyboardSensor,
  MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {
  IconChevronDown, IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight, IconDotsVertical, IconLayoutColumns,
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DragHandle, DraggableRow } from "./draggable-row"
import { Plus } from "lucide-react"
import { ImportExcelDialog } from "../excel-popup"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { envConfig } from "@/configs/env.config"
import { http } from "@/configs/http.comfig"

export const clubSchema = z.object({
  id: z.number(),
  organizationId: z.number(),
  logoUrl: z.string().nullable().optional(),
  organizationName: z.string(),
  organizationType: z.string(),
  email: z.string().nullable().optional(),
  status: z.string().optional(),
})

type Club = z.infer<typeof clubSchema>

const columns: ColumnDef<Club>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
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
    cell: ({ row }) => <span>{row.original.organizationType}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span>{row.original.email ?? "-"}</span>,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

const ORG_TYPES = ["university", "club", "department", "company"] as const

function CreateOrgDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    organizationName: "",
    organizationType: "club" as string,
    email: "",
    description: "",
    // Leader account
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
        organizationType: form.organizationType,
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
      if (!res?.success) throw new Error(res?.message || "Tạo tổ chức thất bại")
      const leaderEmail = res?.data?.leader?.email || form.leaderEmail
      toast.success(`Tạo tổ chức thành công! Tài khoản quản lý: ${leaderEmail}`)
      setOpen(false)
      setForm({
        organizationName: "", organizationType: "club", email: "", description: "",
        leaderName: "", leaderEmail: "", leaderPassword: "", leaderUniversity: "", leaderPhoneNumber: "",
      })
      onCreated?.()
    } catch (err: any) {
      toast.error(err?.message || "Tạo tổ chức thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-4 flex items-center gap-1">
          <Plus className="size-4" /> Tạo mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo tổ chức / CLB mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Org info */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="org-name">Tên tổ chức / CLB *</Label>
            <Input
              id="org-name"
              value={form.organizationName}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="org-type">Loại *</Label>
            <Select
              value={form.organizationType}
              onValueChange={(v) => setForm((f) => ({ ...f, organizationType: v }))}
            >
              <SelectTrigger id="org-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="org-email">Email tổ chức</Label>
            <Input
              id="org-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="org-desc">Mô tả</Label>
            <Input
              id="org-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Leader account section */}
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 p-4 mt-1">
            <p className="text-sm font-medium text-muted-foreground">Tài khoản quản lý (tạo tự động)</p>
            <div className="flex flex-col gap-1">
              <Label htmlFor="leader-name">Họ và tên *</Label>
              <Input
                id="leader-name"
                value={form.leaderName}
                onChange={(e) => setForm((f) => ({ ...f, leaderName: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="leader-email">Email đăng nhập *</Label>
              <Input
                id="leader-email"
                type="email"
                value={form.leaderEmail}
                onChange={(e) => setForm((f) => ({ ...f, leaderEmail: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="leader-password">Mật khẩu * (tối thiểu 8 ký tự)</Label>
              <Input
                id="leader-password"
                type="password"
                value={form.leaderPassword}
                onChange={(e) => setForm((f) => ({ ...f, leaderPassword: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="leader-university">Trường *</Label>
              <Input
                id="leader-university"
                value={form.leaderUniversity}
                onChange={(e) => setForm((f) => ({ ...f, leaderUniversity: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="leader-phone">Số điện thoại</Label>
              <Input
                id="leader-phone"
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

const ORG_REQUIRED_HEADERS = ["organizationName", "organizationType"]

function validateCSVHeaders(csvText: string, required: string[]): string | null {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return "File phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu"
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const missing = required.filter((h) => !headers.includes(h))
  if (missing.length > 0) return `Không đúng định dạng — thiếu cột bắt buộc: ${missing.join(", ")}`
  return null
}

async function importOrgsCSV(csvText: string) {
  const formatError = validateCSVHeaders(csvText, ORG_REQUIRED_HEADERS)
  if (formatError) throw new Error(formatError)

  const res = await http.post<{ success: boolean; data: any }>(
    `${envConfig.NEXT_PUBLIC_API_URL}/admin/organizations/import`,
    { csv: csvText }
  ) as any
  if (!res?.success) throw new Error(res?.message || "Import thất bại")
  const { created, failed, errors } = res.data
  if (failed > 0) {
    toast.warning(`Nhập ${created} thành công, ${failed} thất bại: ${errors.map((e: any) => `dòng ${e.row}`).join(", ")}`)
  } else {
    toast.success(`Nhập thành công ${created} tổ chức`)
  }
}

export function ClubTable({ data: initialData, onRefresh }: { data: Club[]; onRefresh?: () => void }) {
  const [data, setData] = React.useState<Club[]>(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data.map(({ id }) => id), [data])

  const table = useReactTable({
    data, columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  async function handleImport(csvText: string) {
    await importOrgsCSV(csvText)
    onRefresh?.()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between px-4 lg:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <IconChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table.getAllColumns()
              .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-[15px]">
          <ImportExcelDialog onSubmit={handleImport} templateHref="/templates/organizations-template.csv" />
          <CreateOrgDialog onCreated={onRefresh} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="club-rows-per-page" className="text-sm font-medium">Rows per page</Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="club-rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <IconChevronsLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <IconChevronLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <IconChevronRight />
            </Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
