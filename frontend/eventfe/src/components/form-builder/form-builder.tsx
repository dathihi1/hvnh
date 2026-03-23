"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconGripVertical,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react"
import type {
  CreateFormPayload,
  CreateSectionPayload,
  CreateQuestionPayload,
  QuestionType,
} from "@/types/form/form.types"

// ─── Types that need at least 1 option ──────────────────────────────────────
const CHOICE_TYPES: QuestionType[] = ["multiple_choice", "checkboxes", "dropdown"]

const QUESTION_TYPE_LABELS: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Văn bản ngắn" },
  { value: "paragraph", label: "Văn bản dài" },
  { value: "multiple_choice", label: "Trắc nghiệm (1 đáp án)" },
  { value: "checkboxes", label: "Trắc nghiệm (nhiều đáp án)" },
  { value: "dropdown", label: "Dropdown" },
  { value: "linear_scale", label: "Đánh giá / thang điểm" },
  { value: "date", label: "Ngày tháng" },
  { value: "file_upload", label: "Tải tệp" },
]

// ─── Validation ──────────────────────────────────────────────────────────────

interface ValidationErrors {
  title?: string
  sections?: Record<number, {
    title?: string
    questions?: Record<number, { title?: string; options?: string }>
  }>
}

function validateForm(
  title: string,
  sections: CreateSectionPayload[]
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!title.trim()) {
    errors.title = "Tên form không được để trống"
  }

  const sectionErrors: ValidationErrors["sections"] = {}

  sections.forEach((section, sIdx) => {
    const sErr: { title?: string; questions?: Record<number, { title?: string; options?: string }> } = {}

    if (!section.title.trim()) {
      sErr.title = "Tiêu đề phần không được để trống"
    }

    const qErrors: Record<number, { title?: string; options?: string }> = {}
    ;(section.questions ?? []).forEach((q, qIdx) => {
      const qErr: { title?: string; options?: string } = {}

      if (!q.title.trim()) {
        qErr.title = "Nội dung câu hỏi không được để trống"
      }

      if (CHOICE_TYPES.includes(q.type)) {
        const validOptions = (q.options ?? []).filter((o) => o.label.trim())
        if (validOptions.length === 0) {
          qErr.options = "Cần ít nhất 1 lựa chọn"
        }
      }

      if (Object.keys(qErr).length > 0) {
        qErrors[qIdx] = qErr
      }
    })

    if (Object.keys(qErrors).length > 0) {
      sErr.questions = qErrors
    }

    if (Object.keys(sErr).length > 0) {
      sectionErrors[sIdx] = sErr
    }
  })

  if (Object.keys(sectionErrors).length > 0) {
    errors.sections = sectionErrors
  }

  return errors
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newQuestion(order: number): CreateQuestionPayload {
  return { title: "", type: "short_text", order, required: false, options: [] }
}

function newSection(order: number): CreateSectionPayload {
  return { title: `Phần ${order + 1}`, order, questions: [newQuestion(0)] }
}

// ─── Sortable Question ────────────────────────────────────────────────────────

function SortableQuestion({
  question,
  index,
  sectionIndex,
  errors,
  onUpdate,
  onRemove,
}: {
  question: CreateQuestionPayload
  index: number
  sectionIndex: number
  errors?: { title?: string; options?: string }
  onUpdate: (q: CreateQuestionPayload) => void
  onRemove: () => void
}) {
  const id = `s${sectionIndex}-q${index}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isChoiceType = CHOICE_TYPES.includes(question.type)

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
          <IconGripVertical className="size-4" />
        </button>

        <div className="flex-1 space-y-1">
          <Input
            value={question.title}
            onChange={(e) => onUpdate({ ...question, title: e.target.value })}
            placeholder="Nhập câu hỏi..."
            className={`font-medium ${errors?.title ? "border-red-500" : ""}`}
          />
          {errors?.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        <Select
          value={question.type}
          onValueChange={(v) =>
            onUpdate({ ...question, type: v as QuestionType, options: [] })
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPE_LABELS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button onClick={onRemove} className="text-red-500 hover:text-red-700">
          <IconTrash className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={question.required}
            onCheckedChange={(c) => onUpdate({ ...question, required: !!c })}
          />
          <span>Bắt buộc</span>
        </label>
      </div>

      {isChoiceType && (
        <div className="space-y-2 pl-6">
          <p className="text-xs font-medium text-muted-foreground">Tùy chọn:</p>
          {(question.options ?? [{ label: "" }]).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">{oi + 1}.</span>
              <Input
                value={opt.label}
                onChange={(e) => {
                  const next = [...(question.options ?? [{ label: "" }])]
                  next[oi] = { ...next[oi], label: e.target.value }
                  onUpdate({ ...question, options: next })
                }}
                placeholder={`Tùy chọn ${oi + 1}`}
                className="flex-1 h-8 text-sm"
              />
              <button
                onClick={() => {
                  const next = (question.options ?? []).filter((_, i) => i !== oi)
                  onUpdate({ ...question, options: next.length > 0 ? next : [] })
                }}
                className="text-red-400 hover:text-red-600"
              >
                <IconTrash className="size-3" />
              </button>
            </div>
          ))}
          {errors?.options && (
            <p className="text-xs text-red-500">{errors.options}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onUpdate({
                ...question,
                options: [...(question.options ?? []), { label: "", order: (question.options ?? []).length }],
              })
            }
          >
            <IconPlus className="size-3 mr-1" /> Thêm tùy chọn
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Main FormBuilder ─────────────────────────────────────────────────────────

interface FormBuilderProps {
  initialData?: CreateFormPayload
  onSave: (data: CreateFormPayload) => void
  isSaving?: boolean
}

export function FormBuilder({ initialData, onSave, isSaving }: FormBuilderProps) {
  const [title, setTitle] = React.useState(initialData?.title ?? "")
  const [description, setDescription] = React.useState(initialData?.description ?? "")
  const [sections, setSections] = React.useState<CreateSectionPayload[]>(
    initialData?.sections ?? [newSection(0)]
  )
  const [errors, setErrors] = React.useState<ValidationErrors>({})

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent, sectionIndex: number) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sectionIndex] }
      const questions = [...(section.questions ?? [])]
      const oldIdx = questions.findIndex((_, i) => `s${sectionIndex}-q${i}` === active.id)
      const newIdx = questions.findIndex((_, i) => `s${sectionIndex}-q${i}` === over.id)
      section.questions = arrayMove(questions, oldIdx, newIdx).map((q, i) => ({ ...q, order: i }))
      next[sectionIndex] = section
      return next
    })
  }

  const addSection = () =>
    setSections((prev) => [...prev, newSection(prev.length)])

  const removeSection = (idx: number) =>
    setSections((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i }))
    )

  const updateSection = (idx: number, updates: Partial<CreateSectionPayload>) =>
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)))

  const addQuestion = (sIdx: number) =>
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sIdx] }
      section.questions = [...(section.questions ?? []), newQuestion((section.questions ?? []).length)]
      next[sIdx] = section
      return next
    })

  const updateQuestion = (sIdx: number, qIdx: number, q: CreateQuestionPayload) =>
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sIdx] }
      section.questions = (section.questions ?? []).map((old, i) => (i === qIdx ? q : old))
      next[sIdx] = section
      return next
    })

  const removeQuestion = (sIdx: number, qIdx: number) =>
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sIdx] }
      section.questions = (section.questions ?? [])
        .filter((_, i) => i !== qIdx)
        .map((q, i) => ({ ...q, order: i }))
      next[sIdx] = section
      return next
    })

  const handleSave = () => {
    const validationErrors = validateForm(title, sections)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    const cleanSections: CreateSectionPayload[] = sections.map((s, sIdx) => ({
      ...s,
      order: sIdx,
      questions: (s.questions ?? []).map((q, qIdx) => ({
        ...q,
        order: qIdx,
        options: CHOICE_TYPES.includes(q.type)
          ? (q.options ?? [])
              .filter((o) => o.label.trim())
              .map((o, oi) => ({ ...o, order: oi }))
          : [],
      })),
    }))

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      sections: cleanSections,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Form header */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên biểu mẫu..."
              className={`text-xl font-semibold border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 ${
                errors.title ? "border-red-500" : ""
              }`}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả biểu mẫu (tùy chọn)..."
            className="resize-none border-0 border-b rounded-none px-0 focus-visible:ring-0"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section, sIdx) => {
        const sErr = errors.sections?.[sIdx]
        return (
          <Card key={sIdx} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                    placeholder="Tiêu đề phần..."
                    className={`text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 ${
                      sErr?.title ? "border-red-500" : ""
                    }`}
                  />
                  {sErr?.title && <p className="text-xs text-red-500">{sErr.title}</p>}
                </div>
                {sections.length > 1 && (
                  <button onClick={() => removeSection(sIdx)} className="text-red-500 hover:text-red-700">
                    <IconTrash className="size-5" />
                  </button>
                )}
              </div>
              <Input
                value={section.description ?? ""}
                onChange={(e) => updateSection(sIdx, { description: e.target.value || null })}
                placeholder="Mô tả phần (tùy chọn)..."
                className="text-sm border-0 border-b rounded-none px-0 focus-visible:ring-0 text-muted-foreground"
              />
            </CardHeader>

            <CardContent className="space-y-3">
              <DndContext
                id={`form-section-dnd-${sIdx}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, sIdx)}
              >
                <SortableContext
                  items={(section.questions ?? []).map((_, i) => `s${sIdx}-q${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {(section.questions ?? []).map((q, qIdx) => (
                    <SortableQuestion
                      key={`s${sIdx}-q${qIdx}`}
                      question={q}
                      index={qIdx}
                      sectionIndex={sIdx}
                      errors={sErr?.questions?.[qIdx]}
                      onUpdate={(updated) => updateQuestion(sIdx, qIdx, updated)}
                      onRemove={() => removeQuestion(sIdx, qIdx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => addQuestion(sIdx)}
              >
                <IconPlus className="size-4 mr-2" /> Thêm câu hỏi
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addSection}>
          <IconPlus className="size-4 mr-2" /> Thêm phần mới
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu biểu mẫu"}
        </Button>
      </div>
    </div>
  )
}
