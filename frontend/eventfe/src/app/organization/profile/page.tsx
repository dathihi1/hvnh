"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui-custom/ImageUpload"
import { getMyOrganization, updateMyOrganization } from "@/services/organization.service"
import { getMe } from "@/services/auth.service"
import { http } from "@/configs/http.comfig"

interface OrgFormValues {
  organizationName: string
  organizationType: string
  description: string
}

interface UserFormValues {
  userName: string
  studentId: string
  email: string
  university: string
  faculty: string
  className: string
  phoneNumber: string
}

export default function OrgProfilePage() {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [userSubmitting, setUserSubmitting] = useState(false)

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  })

  const org = orgData?.data
  const user = meData?.data?.user

  const { register, handleSubmit, formState: { errors } } = useForm<OrgFormValues>({
    values: {
      organizationName: org?.organizationName ?? "",
      organizationType: org?.organizationType ?? "",
      description: org?.description ?? "",
    },
  })

  const userForm = useForm<UserFormValues>({
    defaultValues: {
      userName: "",
      studentId: "",
      email: "",
      university: "",
      faculty: "",
      className: "",
      phoneNumber: "",
    },
  })

  useEffect(() => {
    if (user) {
      userForm.reset({
        userName: user.userName ?? "",
        studentId: user.studentId ?? "",
        email: user.email ?? "",
        university: user.university ?? "",
        faculty: user.faculty ?? "",
        className: user.className ?? "",
        phoneNumber: user.phoneNumber ?? "",
      })
    }
  }, [user])

  const handleLogoUpload = async (key: string) => {
    if (!org?.organizationId) return
    try {
      const res = await updateMyOrganization(org.organizationId, { logoUrl: key })
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["my-organization"] })
        toast.success("Cập nhật logo thành công")
      } else {
        toast.error("Cập nhật logo thất bại")
      }
    } catch {
      toast.error("Cập nhật logo thất bại")
    }
  }

  const handleCoverUpload = async (key: string) => {
    if (!org?.organizationId) return
    try {
      const res = await updateMyOrganization(org.organizationId, { coverImageUrl: key })
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["my-organization"] })
        toast.success("Cập nhật ảnh bìa thành công")
      } else {
        toast.error("Cập nhật ảnh bìa thất bại")
      }
    } catch {
      toast.error("Cập nhật ảnh bìa thất bại")
    }
  }

  const onSubmitOrg = async (data: OrgFormValues) => {
    if (!org?.organizationId) return
    setSubmitting(true)
    try {
      const res = await updateMyOrganization(org.organizationId, data)
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["my-organization"] })
        toast.success("Cập nhật thông tin thành công")
      } else {
        toast.error("Cập nhật thất bại")
      }
    } catch {
      toast.error("Cập nhật thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAvatarUpload = async (key: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL
    try {
      const res = await http.put<{ success: boolean; message?: string }>(`${API}/users/me`, { avatarUrl: key })
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["me"] })
        toast.success("Cập nhật ảnh đại diện thành công")
      } else {
        toast.error(res?.message ?? "Cập nhật ảnh đại diện thất bại")
      }
    } catch {
      toast.error("Cập nhật ảnh đại diện thất bại")
    }
  }

  const onSubmitUser = async (data: UserFormValues) => {
    setUserSubmitting(true)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL
      const body: Record<string, any> = {
        userName: data.userName,
        studentId: data.studentId || null,
        university: data.university,
        faculty: data.faculty || null,
        className: data.className || null,
        phoneNumber: data.phoneNumber || null,
      }
      const res = await http.put<{ success: boolean; message?: string }>(`${API}/users/me`, body)
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["me"] })
        toast.success("Cập nhật thông tin cá nhân thành công")
      } else {
        toast.error(res?.message ?? "Cập nhật thất bại")
      }
    } catch {
      toast.error("Cập nhật thất bại")
    } finally {
      setUserSubmitting(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="px-[180px] py-10 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-[180px] py-10 bg-gray-100 min-h-screen space-y-6">
      {/* Thông tin tổ chức */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tổ chức</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ảnh bìa — constrained height */}
          <div>
            <Label className="mb-2 block">Ảnh bìa</Label>
            <div className="w-full h-[200px] overflow-hidden rounded-lg">
              <ImageUpload
                folder="covers"
                variant="cover"
                currentImageUrl={org?.coverImageUrl ?? null}
                onUpload={handleCoverUpload}
                className="w-full h-full [&>div]:h-full [&>div]:min-h-0 [&_img]:object-cover"
              />
            </div>
          </div>

          {/* Logo + thông tin cơ bản */}
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <Label className="mb-2 block">Logo</Label>
              <ImageUpload
                folder="logos"
                variant="avatar"
                currentImageUrl={org?.logoUrl ?? null}
                onUpload={handleLogoUpload}
              />
            </div>
            <form onSubmit={handleSubmit(onSubmitOrg)} className="flex-1 space-y-4">
              <div>
                <Label>Tên tổ chức</Label>
                <Input {...register("organizationName", { required: true })} />
                {errors.organizationName && <p className="text-red-500 text-xs mt-1">Vui lòng nhập tên tổ chức</p>}
              </div>
              <div>
                <Label>Loại hình</Label>
                <Input {...register("organizationType")} placeholder="VD: Câu lạc bộ, Đội nhóm..." />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea {...register("description")} rows={4} placeholder="Mô tả về tổ chức..." />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin cá nhân */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <ImageUpload
                folder="avatars"
                variant="avatar"
                currentImageUrl={user?.avatarUrl ?? null}
                onUpload={handleAvatarUpload}
              />
            </div>
            <div>
              <CardTitle>Thông tin cá nhân (người quản lý)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form id="form-user-profile" onSubmit={userForm.handleSubmit(onSubmitUser)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Họ tên:</Label>
                <Input {...userForm.register("userName", { required: "Vui lòng nhập họ tên" })} />
                {userForm.formState.errors.userName && (
                  <p className="text-red-500 text-xs">{userForm.formState.errors.userName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Mã sinh viên:</Label>
                <Input {...userForm.register("studentId")} />
              </div>
              <div className="space-y-1">
                <Label>Email:</Label>
                <Input {...userForm.register("email")} type="email" disabled className="bg-gray-50" />
              </div>
              <div className="space-y-1">
                <Label>Trường:</Label>
                <Input {...userForm.register("university", { required: "Vui lòng nhập trường" })} placeholder="VD: Đại học Bách Khoa HCM" />
                {userForm.formState.errors.university && (
                  <p className="text-red-500 text-xs">{userForm.formState.errors.university.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Khoa:</Label>
                <Input {...userForm.register("faculty")} placeholder="VD: Khoa Công nghệ thông tin" />
              </div>
              <div className="space-y-1">
                <Label>Lớp niên chế:</Label>
                <Input {...userForm.register("className")} placeholder="VD: CNTT2021" />
              </div>
              <div className="space-y-1">
                <Label>Số điện thoại:</Label>
                <Input {...userForm.register("phoneNumber")} />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button type="submit" form="form-user-profile" className="w-[300px]" disabled={userSubmitting}>
            {userSubmitting ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
