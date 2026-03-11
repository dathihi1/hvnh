"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MauForm, CauHoi, SubmitFormPayload } from "@/types/form/form.types"

interface FormRendererProps {
  form: MauForm
  onSubmit: (data: SubmitFormPayload) => void
  isSubmitting?: boolean
}

function evaluateCondition(
  condition: CauHoi["DieuKienHienThi"],
  answers: Record<string, string | string[]>
): boolean {
  if (!condition) return true
  const value = answers[condition.maCauHoi]
  const target = condition.giaTri
  const actual = Array.isArray(value) ? value.join(",") : (value || "")

  switch (condition.phepSo) {
    case "BANG": return actual === target
    case "KHAC": return actual !== target
    case "CHUA": return Array.isArray(value) ? value.includes(target) : actual.includes(target)
    default: return true
  }
}

function QuestionField({ question, control, answers }: {
  question: CauHoi
  control: any
  answers: Record<string, string | string[]>
}) {
  const visible = evaluateCondition(question.DieuKienHienThi, answers)
  if (!visible) return null

  const fieldName = `answers.${question.MaCauHoi}`

  switch (question.LoaiCauHoi) {
    case "TEXT":
    case "NUMBER":
    case "DATE":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{ required: question.BatBuoc ? "Truong nay bat buoc" : false }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
              {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
              <Input
                {...field}
                type={question.LoaiCauHoi === "NUMBER" ? "number" : question.LoaiCauHoi === "DATE" ? "date" : "text"}
                placeholder={question.NoiDung}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )

    case "TEXTAREA":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{ required: question.BatBuoc ? "Truong nay bat buoc" : false }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
              {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
              <Textarea {...field} placeholder={question.NoiDung} />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )

    case "RADIO":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{ required: question.BatBuoc ? "Truong nay bat buoc" : false }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
              {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
              <div className="space-y-2 mt-1">
                {(question.TuyChon || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={opt}
                      checked={field.value === opt}
                      onChange={() => field.onChange(opt)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )

    case "CHECKBOX":
      return (
        <Controller
          name={fieldName}
          control={control}
          defaultValue={[]}
          render={({ field, fieldState }) => {
            const selected: string[] = Array.isArray(field.value) ? field.value : []
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
                {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
                <div className="space-y-2 mt-1">
                  {(question.TuyChon || []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selected.includes(opt)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...selected, opt]
                            : selected.filter((v) => v !== opt)
                          field.onChange(next)
                        }}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </Field>
            )
          }}
        />
      )

    case "SELECT":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{ required: question.BatBuoc ? "Truong nay bat buoc" : false }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
              {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chon..." />
                </SelectTrigger>
                <SelectContent>
                  {(question.TuyChon || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )

    case "RATING":
      return (
        <Controller
          name={fieldName}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => field.onChange(String(star))}
                    className={`text-2xl ${Number(field.value) >= star ? "text-yellow-500" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </Field>
          )}
        />
      )

    case "FILE":
      return (
        <Field>
          <FieldLabel>{question.NoiDung} {question.BatBuoc && <span className="text-red-500">*</span>}</FieldLabel>
          {question.MoTa && <p className="text-xs text-muted-foreground mb-1">{question.MoTa}</p>}
          <Input type="file" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">File upload (coming soon)</p>
        </Field>
      )

    default:
      return (
        <Controller
          name={fieldName}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{question.NoiDung}</FieldLabel>
              <Input {...field} />
            </Field>
          )}
        />
      )
  }
}

export function FormRenderer({ form: formData, onSubmit, isSubmitting }: FormRendererProps) {
  const rhf = useForm<{ answers: Record<string, string | string[]> }>({
    defaultValues: { answers: {} },
  })

  const answers = rhf.watch("answers") || {}

  const handleSubmit = rhf.handleSubmit((data) => {
    const allQuestions = formData.phanForm.flatMap((p) => p.cauHoi)
    const danhSachCauTraLoi = allQuestions
      .filter((q) => evaluateCondition(q.DieuKienHienThi, data.answers))
      .map((q) => {
        const val = data.answers[q.MaCauHoi]
        return {
          MaCauHoi: q.MaCauHoi,
          ...(Array.isArray(val)
            ? { GiaTriNhieu: val }
            : { GiaTri: val || "" }),
        }
      })

    onSubmit({ DanhSachCauTraLoi: danhSachCauTraLoi })
  })

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{formData.TenForm}</CardTitle>
            {formData.MoTa && (
              <p className="text-sm text-muted-foreground">{formData.MoTa}</p>
            )}
          </CardHeader>
        </Card>

        {formData.phanForm.map((section) => {
          const sectionVisible = evaluateCondition(section.DieuKienHienThi, answers)
          if (!sectionVisible) return null

          return (
            <Card key={section.MaPhan}>
              <CardHeader>
                <CardTitle className="text-lg">{section.TieuDe}</CardTitle>
                {section.MoTa && (
                  <p className="text-sm text-muted-foreground">{section.MoTa}</p>
                )}
              </CardHeader>
              <CardContent>
                <FieldGroup className="space-y-5">
                  {section.cauHoi.map((q) => (
                    <QuestionField
                      key={q.MaCauHoi}
                      question={q}
                      control={rhf.control}
                      answers={answers}
                    />
                  ))}
                </FieldGroup>
              </CardContent>
            </Card>
          )
        })}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-32">
            {isSubmitting ? "Dang nop..." : "Nop form"}
          </Button>
        </div>
      </div>
    </form>
  )
}
