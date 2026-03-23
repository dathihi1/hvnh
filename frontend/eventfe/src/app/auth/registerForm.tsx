"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui-custom/password-input"
import { SelectCustom } from "@/components/ui-custom/select.ui.custom"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"
import { toastError, toastSuccess } from "@/lib/toast"
import { useUniversity } from "@/hooks/useUniversity.hook"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  userName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  studentId: z.string().optional(),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().min(10, "Số điện thoại phải có 10 chữ số"),
  password: z.string().min(6, "Không đủ 6 kí tự"),
  university: z.string().min(1, "Vui lòng chọn trường"),
})

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps = {}) {
  const router = useRouter()
  const { data } = useUniversity({ size: -1 })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      studentId: "",
      email: "",
      phoneNumber: "",
      password: "",
      university: "",
    },
  })

  async function onSubmit(datavalue: z.infer<typeof formSchema>) {
    const res = await http.post(`/api/auth/register`, datavalue) as any

    if (!res?.success) {
      toastError(res?.message || "Đăng ký thất bại")
      return
    }

    toastSuccess("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.")
    onSuccess?.()
    router.push(`/auth/verify-code?userId=${res.userId}&email=${encodeURIComponent(res.email)}`)
  }

  return (
    <>
      <CardContent>
        <form id="form-register" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-[11px]">
            <Controller
              name="userName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-name">
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-register-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ava Wright"
                    autoComplete="on"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="studentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-student-id">
                    Mã sinh viên
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-register-student-id"
                    aria-invalid={fieldState.invalid}
                    placeholder="VD: 2051234567"
                    autoComplete="on"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-email">
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-register-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="ava.wright@gmail.com"
                    autoComplete="on"
                    type="email"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-phone">
                    Phone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-register-phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="0xxxxxxxxx"
                    autoComplete="on"
                    type="tel"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-password">
                    Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="form-register-password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="university"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-register-university">
                    University
                  </FieldLabel>
                  <SelectCustom
                    value={field.value}
                    onChange={field.onChange}
                    data={data?.data || []}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex flex-col mt-[20px]">
          <Button type="submit" form="form-register" className="w-[130px] h-[40px] bg-[#056382] hover:bg-[#056382] cursor-pointer">
            Sign up
          </Button>
          <Button
            type="button"
            onClick={() => { window.location.href = `${envConfig.NEXT_PUBLIC_API_URL}/auth/google` }}
            className="w-[327px] h-[48px] bg-white border border-[#EFF0F6] text-black shadow-[inset_0px_-3px_6px_0px_#F4F5FA99] hover:bg-white cursor-pointer"
          >
            Sign up with Google
          </Button>
        </Field>
      </CardFooter>
    </>
  )
}
