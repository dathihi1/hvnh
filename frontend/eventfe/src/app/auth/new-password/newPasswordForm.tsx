"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import * as z from "zod"
import { Suspense } from "react"

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
import { PasswordInput } from "@/components/ui-custom/password-input"
import { http } from "@/configs/http.comfig"

const formSchema = z.object({
  password: z.string().min(8, "Không đủ 8 ký tự"),
  confirmPassword: z.string().min(8, "Không đủ 8 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
})

function NewPasswordFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error("Link không hợp lệ hoặc đã hết hạn")
      return
    }

    const res = await http.post("/api/auth/reset-password", {
      token,
      newPassword: data.password,
    }) as any

    if (!res?.success) {
      toast.error(res?.message || "Có lỗi xảy ra")
      return
    }

    toast.success("Đặt lại mật khẩu thành công")
    router.push("/")
  }

  return (
    <>
      <CardContent>
        <form id="new-password" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-password-password">Mật khẩu mới</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="new-password-password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-password-confirm">Xác nhận mật khẩu</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="new-password-confirm"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="submit"
            form="new-password"
            className="mx-auto w-full h-[46px] bg-[#056382] hover:bg-[#056382]"
          >
            Cập nhật mật khẩu
          </Button>
        </Field>
      </CardFooter>
    </>
  )
}

export default function NewPasswordForm() {
  return (
    <Suspense fallback={null}>
      <NewPasswordFormContent />
    </Suspense>
  )
}
