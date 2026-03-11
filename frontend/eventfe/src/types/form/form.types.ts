// ─── Question types ─────────────────────────────────────────────────────────

export type LoaiCauHoi =
  | "TEXT"
  | "TEXTAREA"
  | "RADIO"
  | "CHECKBOX"
  | "SELECT"
  | "FILE"
  | "DATE"
  | "NUMBER"
  | "RATING"
  | "TABLE"

export type TrangThaiForm = "NHAP" | "DANG_MO" | "DA_DONG"
export type TrangThaiPhanHoi = "NHAP" | "DA_NOP" | "DA_DUYET" | "TU_CHOI"

export interface DieuKienHienThi {
  maCauHoi: string
  phepSo: "BANG" | "KHAC" | "CHUA"
  giaTri: string
}

export interface QuyTacXacThuc {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  fileTypes?: string[]
  maxFileSize?: number
}

// ─── Form structure ─────────────────────────────────────────────────────────

export interface CauHoi {
  MaCauHoi: string
  NoiDung: string
  MoTa?: string
  LoaiCauHoi: LoaiCauHoi
  ThuTu: number
  BatBuoc: boolean
  TuyChon?: string[]
  QuyTacXacThuc?: QuyTacXacThuc
  DieuKienHienThi?: DieuKienHienThi
}

export interface PhanForm {
  MaPhan: string
  TieuDe: string
  MoTa?: string
  ThuTu: number
  DieuKienHienThi?: DieuKienHienThi
  cauHoi: CauHoi[]
}

export interface MauForm {
  MaForm: string
  TenForm: string
  MoTa?: string
  CauHinhForm?: { choPhepSua?: boolean; gioiHanNop?: number }
  TrangThai: TrangThaiForm
  MaHoatDong?: string
  MaDot?: string
  isDelete: boolean
  createAt: string
  createBy?: string
  phanForm: PhanForm[]
  _count?: { phanHoiForm: number }
}

// ─── Submission ─────────────────────────────────────────────────────────────

export interface CauTraLoi {
  MaCauTraLoi: string
  GiaTri?: string
  GiaTriNhieu?: string[]
  TapTin?: string
  MaCauHoi: string
  cauHoi?: { MaCauHoi: string; NoiDung: string; LoaiCauHoi?: string }
}

export interface PhanHoiForm {
  MaPhanHoi: string
  ThoiGianNop: string
  TrangThai: TrangThaiPhanHoi
  MaForm: string
  MaNguoiDung: string
  nguoiDung?: { MaNguoiDung: string; TenNguoiDung: string; Email?: string }
  cauTraLoi: CauTraLoi[]
}

// ─── API payloads ───────────────────────────────────────────────────────────

export interface CreateCauHoiPayload {
  NoiDung: string
  MoTa?: string
  LoaiCauHoi: LoaiCauHoi
  ThuTu: number
  BatBuoc?: boolean
  TuyChon?: string[]
  QuyTacXacThuc?: QuyTacXacThuc
  DieuKienHienThi?: DieuKienHienThi
}

export interface CreatePhanFormPayload {
  TieuDe: string
  MoTa?: string
  ThuTu: number
  DieuKienHienThi?: DieuKienHienThi
  DanhSachCauHoi: CreateCauHoiPayload[]
}

export interface CreateFormPayload {
  TenForm: string
  MoTa?: string
  CauHinhForm?: { choPhepSua?: boolean; gioiHanNop?: number }
  MaHoatDong?: string
  MaDot?: string
  DanhSachPhan: CreatePhanFormPayload[]
}

export interface SubmitFormPayload {
  DanhSachCauTraLoi: {
    MaCauHoi: string
    GiaTri?: string
    GiaTriNhieu?: string[]
    TapTin?: string
  }[]
}

// ─── API response wrappers ──────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface FormListResponse {
  success: boolean
  data: PaginatedResponse<MauForm>
}

export interface FormDetailResponse {
  success: boolean
  data: MauForm
}

export interface ResponseListResponse {
  success: boolean
  data: PaginatedResponse<PhanHoiForm>
}
