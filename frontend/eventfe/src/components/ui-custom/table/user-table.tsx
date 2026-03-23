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

export const studentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  avatarUrl: z.string().nullable().optional(),
  userName: z.string(),
  email: z.string(),
  studentId: z.string().nullable().optional(),
  university: z.string(),
  phoneNumber: z.string().nullable().optional(),
  status: z.string(),
  roles: z.array(z.string()).optional(),
})

type Student = z.infer<typeof studentSchema>

const ROLES = ["student", "organization_leader", "organization_member", "club", "admin"] as const

function CreateUserDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    userName: "",
    email: "",
    password: "",
    university: "",
    studentId: "",
    phoneNumber: "",
    role: "student",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, string> = {
        userName: form.userName,
        email: form.email,
        password: form.password,
        university: form.university,
        role: form.role,
      }
      if (form.studentId) body.studentId = form.studentId
      if (form.phoneNumber) body.phoneNumber = form.phoneNumber

      const res = await http.post<{ success: boolean }>(
        `${envConfig.NEXT_PUBLIC_API_URL}/admin/users`,
        body
      ) as any
      if (!res?.success) throw new Error(res?.message || "Tạo tài khoản thất bại")
      toast.success("Tạo tài khoản thành công")
      setOpen(false)
      setForm({ userName: "", email: "", password: "", university: "", studentId: "", phoneNumber: "", role: "student" })
      onCreated?.()
    } catch (err: any) {
      toast.error(err?.message || "Tạo tài khoản thất bại")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-name">Họ và tên *</Label>
            <Input
              id="user-name"
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-email">Email *</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-password">Mật khẩu *</Label>
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-university">Trường *</Label>
            <Input
              id="user-university"
              value={form.university}
              onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-studentId">Mã sinh viên</Label>
            <Input
              id="user-studentId"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-phone">Số điện thoại</Label>
            <Input
              id="user-phone"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="user-role">Vai trò</Label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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

const ORG_TYPES = [
  { value: "club", label: "Câu lạc bộ" },
  { value: "department", label: "Khoa / Phòng ban" },
  { value: "company", label: "Công ty" },
  { value: "university", label: "Trường đại học" },
]

function PromoteUserDialog({ user, onDone, onClose }: { user: Student; onDone?: () => void; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [targetRole, setTargetRole] = React.useState<"admin" | "organization_leader" | "club">("admin")
  const [org, setOrg] = React.useState({
    organizationName: "",
    organizationType: "club",
    email: "",
    description: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, any> = { role: targetRole }
      if (targetRole === "organization_leader" || targetRole === "club") {
        body.organization = {
          organizationName: org.organizationName,
          organizationType: org.organizationType,
          email: org.email || undefined,
          description: org.description || undefined,
        }
      }
      const res = await http.post<{ success: boolean }>(
        `${envConfig.NEXT_PUBLIC_API_URL}/admin/users/${user.userId}/promote`,
        body
      ) as any
      if (!res?.success) throw new Error(res?.message || "Phân quyền thất bại")
      const label = targetRole === "admin" ? "Admin" : targetRole === "club" ? `Trưởng CLB "${org.organizationName}"` : `Trưởng tổ chức "${org.organizationName}"`
      toast.success(`${user.userName} đã được phân quyền ${label}`)
      onDone?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Phân quyền thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân quyền: {user.userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Vai trò mới</Label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as "admin" | "organization_leader" | "club")}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="admin">Admin hệ thống</option>
              <option value="organization_leader">Trưởng tổ chức</option>
              <option value="club">Trưởng câu lạc bộ</option>
            </select>
          </div>

          {(targetRole === "organization_leader" || targetRole === "club") && (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {targetRole === "club" ? "Thông tin câu lạc bộ" : "Thông tin tổ chức"}
              </p>
              <div className="flex flex-col gap-1">
                <Label htmlFor="promo-org-name">
                  {targetRole === "club" ? "Tên CLB *" : "Tên tổ chức *"}
                </Label>
                <Input
                  id="promo-org-name"
                  value={org.organizationName}
                  onChange={(e) => setOrg((o) => ({ ...o, organizationName: e.target.value }))}
                  required={targetRole === "organization_leader" || targetRole === "club"}
                  placeholder={targetRole === "club" ? "VD: CLB Lập trình BKU" : "VD: Đoàn trường"}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="promo-org-type">Loại *</Label>
                <select
                  id="promo-org-type"
                  value={org.organizationType}
                  onChange={(e) => setOrg((o) => ({ ...o, organizationType: e.target.value }))}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="promo-org-email">Email tổ chức / CLB</Label>
                <Input
                  id="promo-org-email"
                  type="email"
                  value={org.email}
                  onChange={(e) => setOrg((o) => ({ ...o, email: e.target.value }))}
                  placeholder="VD: clblt@truong.edu.vn"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="promo-org-desc">Mô tả</Label>
                <Input
                  id="promo-org-desc"
                  value={org.description}
                  onChange={(e) => setOrg((o) => ({ ...o, description: e.target.value }))}
                  placeholder="Mô tả ngắn về tổ chức / CLB"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user, onUpdated, onClose }: { user: Student; onUpdated?: () => void; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    userName: user.userName,
    university: user.university,
    studentId: user.studentId || "",
    phoneNumber: user.phoneNumber || "",
    password: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, string> = {
        userName: form.userName,
        university: form.university,
      }
      if (form.studentId) body.studentId = form.studentId
      if (form.phoneNumber) body.phoneNumber = form.phoneNumber
      if (form.password) body.password = form.password

      const res = await http.put<{ success: boolean }>(
        `${envConfig.NEXT_PUBLIC_API_URL}/admin/users/${user.userId}`,
        body
      ) as any
      if (!res?.success) throw new Error(res?.message || "Cập nhật thất bại")
      toast.success("Cập nhật tài khoản thành công")
      onUpdated?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-user-name">Họ và tên *</Label>
            <Input
              id="edit-user-name"
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-user-university">Trường *</Label>
            <Input
              id="edit-user-university"
              value={form.university}
              onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-user-studentId">Mã sinh viên</Label>
            <Input
              id="edit-user-studentId"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-user-phone">Số điện thoại</Label>
            <Input
              id="edit-user-phone"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-user-password">Mật khẩu mới (để trống nếu không đổi)</Label>
            <Input
              id="edit-user-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const USER_REQUIRED_HEADERS = ["userName", "email", "password", "university"]

function validateCSVHeaders(csvText: string, required: string[]): string | null {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return "File phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu"
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const missing = required.filter((h) => !headers.includes(h))
  if (missing.length > 0) return `Không đúng định dạng — thiếu cột bắt buộc: ${missing.join(", ")}`
  return null
}

async function importUsersCSV(csvText: string) {
  const formatError = validateCSVHeaders(csvText, USER_REQUIRED_HEADERS)
  if (formatError) throw new Error(formatError)

  const res = await http.post<{ success: boolean; data: any }>(
    `${envConfig.NEXT_PUBLIC_API_URL}/admin/users/import`,
    { csv: csvText }
  ) as any
  if (!res?.success) throw new Error(res?.message || "Import thất bại")
  const { created, failed, errors } = res.data
  if (failed > 0) {
    toast.warning(`Nhập ${created} thành công, ${failed} thất bại: ${errors.map((e: any) => `dòng ${e.row}`).join(", ")}`)
  } else {
    toast.success(`Nhập thành công ${created} tài khoản`)
  }
}

export function StudentTable({ data: initialData, onRefresh }: { data: Student[]; onRefresh?: () => void }) {
  const [data, setData] = React.useState<Student[]>(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [editingUser, setEditingUser] = React.useState<Student | null>(null)
  const [promotingUser, setPromotingUser] = React.useState<Student | null>(null)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const columns = React.useMemo<ColumnDef<Student>[]>(() => [
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
      accessorKey: "avatarUrl",
      header: "Avatar",
      cell: ({ row }) => (
        <div className="w-[50px] h-[50px] rounded-full overflow-hidden">
          <img
            src={row.original.avatarUrl || "/hinh-nen-may-tinh-anime.jpg"}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "userName",
      header: "Họ và tên",
      cell: ({ row }) => <span>{row.original.userName}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "studentId",
      header: "Mã sinh viên",
      cell: ({ row }) => <span>{row.original.studentId ?? "-"}</span>,
    },
    {
      accessorKey: "university",
      header: "Trường",
      cell: ({ row }) => <span>{row.original.university}</span>,
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
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setEditingUser(row.original)}>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPromotingUser(row.original)}>Phân quyền</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Xóa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [])

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

  return (
    <div className="flex flex-col gap-4">
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onUpdated={onRefresh}
          onClose={() => setEditingUser(null)}
        />
      )}
      {promotingUser && (
        <PromoteUserDialog
          user={promotingUser}
          onDone={onRefresh}
          onClose={() => setPromotingUser(null)}
        />
      )}
      <div className="flex px-4 lg:px-6 justify-between">
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
          <ImportExcelDialog onSubmit={importUsersCSV} templateHref="/templates/users-template.csv" />
          <CreateUserDialog onCreated={onRefresh} />
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
            <Label htmlFor="student-rows-per-page" className="text-sm font-medium">Rows per page</Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="student-rows-per-page">
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
