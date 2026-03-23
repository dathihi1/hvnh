// Question types matching backend QUESTION_TYPE constant
export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "file_upload"
  | "date"
  | "time"
  | "linear_scale"
  | "multiple_choice_grid"
  | "checkbox_grid"

export type FormStatus = "draft" | "open" | "closed"
export type ResponseStatus = "submitted" | "approved" | "rejected"

// ─── Backend response shapes ─────────────────────────────────────────────────

export interface QuestionOption {
  optionId: number
  label: string
  order: number
  isOther: boolean
  imageUrl?: string | null
  goToSectionId?: number | null
}

export interface GridRow {
  rowId: number
  label: string
  order: number
}

export interface Question {
  questionId: number
  title: string
  description?: string | null
  type: QuestionType
  order: number
  required: boolean
  scaleMin?: number | null
  scaleMax?: number | null
  scaleMinLabel?: string | null
  scaleMaxLabel?: string | null
  allowedFileTypes: string[]
  maxFileSize?: number | null
  maxFiles?: number | null
  imageUrl?: string | null
  videoUrl?: string | null
  validationRules?: Record<string, unknown> | null
  displayCondition?: Record<string, unknown> | null
  options: QuestionOption[]
  gridRows: GridRow[]
}

export interface FormSection {
  sectionId: number
  title: string
  description?: string | null
  order: number
  navigationType: string
  questions: Question[]
}

export interface Form {
  formId: number
  title: string
  description?: string | null
  headerImageUrl?: string | null
  confirmationMessage?: string | null
  status: FormStatus
  collectEmail: boolean
  limitOneResponse: boolean
  allowEditResponse: boolean
  showProgressBar: boolean
  shuffleQuestions: boolean
  requireSignIn: boolean
  responseLimit?: number | null
  openAt?: string | null
  closeAt?: string | null
  activityId?: number | null
  organizationId?: number | null
  createdBy?: number | null
  createdAt: string
  sections: FormSection[]
  _count?: { responses: number }
  organization?: { organizationId: number; organizationName: string } | null
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface FormResponse {
  responseId: number
  status: ResponseStatus
  respondentEmail?: string | null
  submittedAt: string
  formId: number
  userId?: number | null
  user?: { userId: number; userName: string; email: string } | null
  answers: Answer[]
}

export interface Answer {
  answerId: number
  textValue?: string | null
  fileUrl?: string | null
  question: { questionId: number; title: string; type: QuestionType }
  answerOptions: {
    answerOptionId: number
    otherText?: string | null
    option?: { optionId: number; label: string } | null
    row?: { rowId: number; label: string } | null
  }[]
}

// ─── Create/update payloads ───────────────────────────────────────────────────

export interface CreateOptionPayload {
  label: string
  order?: number
  isOther?: boolean
  imageUrl?: string | null
}

export interface CreateGridRowPayload {
  label: string
  order?: number
}

export interface CreateQuestionPayload {
  title: string
  description?: string | null
  type: QuestionType
  order?: number
  required?: boolean
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string | null
  scaleMaxLabel?: string | null
  allowedFileTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  options?: CreateOptionPayload[]
  gridRows?: CreateGridRowPayload[]
  validationRules?: Record<string, unknown>
  displayCondition?: Record<string, unknown>
}

export interface CreateSectionPayload {
  title: string
  description?: string | null
  order?: number
  navigationType?: string
  questions?: CreateQuestionPayload[]
}

export interface CreateFormPayload {
  title: string
  description?: string | null
  headerImageUrl?: string | null
  confirmationMessage?: string | null
  collectEmail?: boolean
  limitOneResponse?: boolean
  allowEditResponse?: boolean
  showProgressBar?: boolean
  shuffleQuestions?: boolean
  requireSignIn?: boolean
  responseLimit?: number | null
  openAt?: string | null
  closeAt?: string | null
  activityId?: number | null
  organizationId?: number | null
  sections: CreateSectionPayload[]
}

export interface SubmitFormPayload {
  respondentEmail?: string | null
  answers: {
    questionId: number
    textValue?: string | null
    fileUrl?: string | null
    selectedOptionIds?: number[]
    otherText?: string | null
    gridAnswers?: { rowId: number; optionId: number }[]
  }[]
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedData<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ─── Aliases ──────────────────────────────────────────────────────────────────
export type MauForm = Form
export type CauHoi = Question
