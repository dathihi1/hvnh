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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconGripVertical,
  IconTrash,
  IconPlus,
  IconCopy,
} from "@tabler/icons-react"
import type {
  CreateFormPayload,
  CreatePhanFormPayload,
  CreateCauHoiPayload,
  LoaiCauHoi,
} from "@/types/form/form.types"

const QUESTION_TYPES: { value: LoaiCauHoi; label: string }[] = [
  { value: "TEXT", label: "Van ban ngan" },
  { value: "TEXTAREA", label: "Van ban dai" },
  { value: "RADIO", label: "Trac nghiem (1 dap an)" },
  { value: "CHECKBOX", label: "Trac nghiem (nhieu dap an)" },
  { value: "SELECT", label: "Dropdown" },
  { value: "NUMBER", label: "So" },
  { value: "DATE", label: "Ngay thang" },
  { value: "RATING", label: "Danh gia sao" },
  { value: "FILE", label: "Tai tep" },
]

function newQuestion(thuTu: number): CreateCauHoiPayload {
  return {
    NoiDung: "",
    LoaiCauHoi: "TEXT",
    ThuTu: thuTu,
    BatBuoc: false,
  }
}

function newSection(thuTu: number): CreatePhanFormPayload {
  return {
    TieuDe: `Phan ${thuTu + 1}`,
    ThuTu: thuTu,
    DanhSachCauHoi: [newQuestion(0)],
  }
}

// ─── Sortable Question ──────────────────────────────────────────────────────

function SortableQuestion({
  question,
  index,
  sectionIndex,
  onUpdate,
  onRemove,
}: {
  question: CreateCauHoiPayload
  index: number
  sectionIndex: number
  onUpdate: (q: CreateCauHoiPayload) => void
  onRemove: () => void
}) {
  const id = `s${sectionIndex}-q${index}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasOptions = ["RADIO", "CHECKBOX", "SELECT"].includes(question.LoaiCauHoi)

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
          <IconGripVertical className="size-4" />
        </button>

        <Input
          value={question.NoiDung}
          onChange={(e) => onUpdate({ ...question, NoiDung: e.target.value })}
          placeholder="Nhap cau hoi..."
          className="flex-1 font-medium"
        />

        <Select
          value={question.LoaiCauHoi}
          onValueChange={(v) => onUpdate({ ...question, LoaiCauHoi: v as LoaiCauHoi })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
            checked={question.BatBuoc}
            onCheckedChange={(c) => onUpdate({ ...question, BatBuoc: !!c })}
          />
          <span>Bat buoc</span>
        </label>
      </div>

      {hasOptions && (
        <div className="space-y-2 pl-6">
          <p className="text-xs font-medium text-muted-foreground">Tuy chon:</p>
          {(question.TuyChon || [""]).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">{oi + 1}.</span>
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...(question.TuyChon || [""])]
                  next[oi] = e.target.value
                  onUpdate({ ...question, TuyChon: next })
                }}
                placeholder={`Tuy chon ${oi + 1}`}
                className="flex-1 h-8 text-sm"
              />
              <button
                onClick={() => {
                  const next = (question.TuyChon || [""]).filter((_, i) => i !== oi)
                  onUpdate({ ...question, TuyChon: next.length > 0 ? next : [""] })
                }}
                className="text-red-400 hover:text-red-600"
              >
                <IconTrash className="size-3" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUpdate({ ...question, TuyChon: [...(question.TuyChon || [""]), ""] })}
          >
            <IconPlus className="size-3 mr-1" /> Them tuy chon
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Main Form Builder ──────────────────────────────────────────────────────

interface FormBuilderProps {
  initialData?: CreateFormPayload
  onSave: (data: CreateFormPayload) => void
  isSaving?: boolean
}

export function FormBuilder({ initialData, onSave, isSaving }: FormBuilderProps) {
  const [tenForm, setTenForm] = React.useState(initialData?.TenForm || "")
  const [moTa, setMoTa] = React.useState(initialData?.MoTa || "")
  const [sections, setSections] = React.useState<CreatePhanFormPayload[]>(
    initialData?.DanhSachPhan || [newSection(0)]
  )

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
      const questions = [...section.DanhSachCauHoi]

      const oldIdx = questions.findIndex((_, i) => `s${sectionIndex}-q${i}` === active.id)
      const newIdx = questions.findIndex((_, i) => `s${sectionIndex}-q${i}` === over.id)

      section.DanhSachCauHoi = arrayMove(questions, oldIdx, newIdx).map((q, i) => ({
        ...q,
        ThuTu: i,
      }))
      next[sectionIndex] = section
      return next
    })
  }

  const addSection = () => {
    setSections((prev) => [...prev, newSection(prev.length)])
  }

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, ThuTu: i })))
  }

  const updateSection = (idx: number, updates: Partial<CreatePhanFormPayload>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)))
  }

  const addQuestion = (sectionIdx: number) => {
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sectionIdx] }
      section.DanhSachCauHoi = [...section.DanhSachCauHoi, newQuestion(section.DanhSachCauHoi.length)]
      next[sectionIdx] = section
      return next
    })
  }

  const updateQuestion = (sectionIdx: number, questionIdx: number, q: CreateCauHoiPayload) => {
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sectionIdx] }
      section.DanhSachCauHoi = section.DanhSachCauHoi.map((old, i) => (i === questionIdx ? q : old))
      next[sectionIdx] = section
      return next
    })
  }

  const removeQuestion = (sectionIdx: number, questionIdx: number) => {
    setSections((prev) => {
      const next = [...prev]
      const section = { ...next[sectionIdx] }
      section.DanhSachCauHoi = section.DanhSachCauHoi
        .filter((_, i) => i !== questionIdx)
        .map((q, i) => ({ ...q, ThuTu: i }))
      next[sectionIdx] = section
      return next
    })
  }

  const handleSave = () => {
    onSave({
      TenForm: tenForm,
      MoTa: moTa || undefined,
      DanhSachPhan: sections,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Form header */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            value={tenForm}
            onChange={(e) => setTenForm(e.target.value)}
            placeholder="Ten form..."
            className="text-xl font-semibold border-0 border-b-2 rounded-none px-0 focus-visible:ring-0"
          />
          <Textarea
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Mo ta form (tuy chon)..."
            className="resize-none border-0 border-b rounded-none px-0 focus-visible:ring-0"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <Card key={sIdx} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Input
                value={section.TieuDe}
                onChange={(e) => updateSection(sIdx, { TieuDe: e.target.value })}
                placeholder="Tieu de phan..."
                className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 flex-1"
              />
              {sections.length > 1 && (
                <button
                  onClick={() => removeSection(sIdx)}
                  className="text-red-500 hover:text-red-700"
                >
                  <IconTrash className="size-5" />
                </button>
              )}
            </div>
            <Input
              value={section.MoTa || ""}
              onChange={(e) => updateSection(sIdx, { MoTa: e.target.value || undefined })}
              placeholder="Mo ta phan (tuy chon)..."
              className="text-sm border-0 border-b rounded-none px-0 focus-visible:ring-0 text-muted-foreground"
            />
          </CardHeader>

          <CardContent className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, sIdx)}
            >
              <SortableContext
                items={section.DanhSachCauHoi.map((_, i) => `s${sIdx}-q${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {section.DanhSachCauHoi.map((q, qIdx) => (
                  <SortableQuestion
                    key={`s${sIdx}-q${qIdx}`}
                    question={q}
                    index={qIdx}
                    sectionIndex={sIdx}
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
              <IconPlus className="size-4 mr-2" /> Them cau hoi
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addSection}>
          <IconPlus className="size-4 mr-2" /> Them phan moi
        </Button>

        <Button onClick={handleSave} disabled={isSaving || !tenForm.trim()}>
          {isSaving ? "Dang luu..." : "Luu form"}
        </Button>
      </div>
    </div>
  )
}
