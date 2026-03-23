"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { http } from "@/configs/http.comfig"
import type { UserProfile } from "@/services/auth.service"

const formSchema = z.object({
  name:         z.string().min(1, "Vui lòng nhập họ tên"),
  student_code: z.string().optional(),
  email:        z.string().email("Email không hợp lệ"),
  university:   z.string().min(1, "Vui lòng nhập trường"),
  faculty:      z.string().optional(),
  className:    z.string().optional(),
  phone:        z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
})

interface ProfileFormProps {
  user?: UserProfile
  isLoading?: boolean
  pendingAvatarKey?: string | null
}

export function ProfileForm({ user, isLoading, pendingAvatarKey }: ProfileFormProps) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:         user?.userName    ?? "",
      student_code: user?.studentId   ?? "",
      email:        user?.email       ?? "",
      university:   user?.university  ?? "",
      faculty:      user?.faculty     ?? "",
      className:    user?.className   ?? "",
      phone:        user?.phoneNumber ?? "",
    },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({
        name:         user.userName    ?? "",
        student_code: user.studentId   ?? "",
        email:        user.email       ?? "",
        university:   user.university  ?? "",
        faculty:      user.faculty     ?? "",
        className:    user.className   ?? "",
        phone:        user.phoneNumber ?? "",
      })
    }
  }, [user])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL
      const body: Record<string, any> = {
        userName: data.name,
        studentId: data.student_code || null,
        university: data.university,
        faculty: data.faculty || null,
        className: data.className || null,
        phoneNumber: data.phone || null,
      }
      if (pendingAvatarKey) body.avatarUrl = pendingAvatarKey

      const res = await http.put<{ success: boolean; data?: any; message?: string }>(
        `${API}/users/me`,
        body,
      )
      if (res?.success) {
        toast.success("Cập nhật hồ sơ thành công")
        queryClient.invalidateQueries({ queryKey: ["me"] })
      } else {
        toast.error(res?.message ?? "Cập nhật thất bại")
      }
    } catch {
      toast.error("Cập nhật thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <CardContent>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </CardContent>
    )
  }

  return (
    <>
      <CardContent>
        <form id="form-profile" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="grid grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Họ tên:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="student_code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Mã sinh viên:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Email:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" type="email" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="university"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Trường:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" placeholder="VD: Đại học Bách Khoa HCM" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="faculty"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Khoa:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" placeholder="VD: Khoa Công nghệ thông tin" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="className"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Lớp niên chế:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" placeholder="VD: CNTT2021" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Số điện thoại:</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} autoComplete="on" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="justify-center">
          <Button type="submit" form="form-profile" className="w-[300px]" disabled={submitting}>
            {submitting ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </Field>
      </CardFooter>
    </>
  )
}
