"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getMyOrganization,
  getOrgApplications,
  updateClubApplication,
  notifyCandidates,
} from "@/services/organization.service";
import { getFormResponses } from "@/services/form.service";
import type { FormResponse } from "@/types/form/form.types";

type ResultFilter = "" | "pending" | "interview" | "accepted" | "rejected";

const RESULT_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  interview: "Phỏng vấn",
  accepted: "Đã duyệt",
  rejected: "Đã loại",
};

const RESULT_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  interview: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function AnswerPanel({ response }: { response: FormResponse }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Nộp lúc {new Date(response.submittedAt).toLocaleString("vi-VN")}
      </p>
      {response.answers.map((answer) => {
        let display: string;
        if (answer.answerOptions.length > 0) {
          display = answer.answerOptions
            .map((ao) => {
              if (ao.row) return `${ao.row.label}: ${ao.option?.label ?? ao.otherText ?? ""}`;
              return ao.option?.label ?? ao.otherText ?? "";
            })
            .filter(Boolean)
            .join(", ");
        } else {
          display = answer.textValue ?? "-";
        }
        return (
          <div key={answer.answerId} className="space-y-1">
            <p className="text-sm font-medium text-gray-700">{answer.question.title}</p>
            <p className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">{display}</p>
          </div>
        );
      })}
    </div>
  );
}

function buildCalendarUrl(title: string, description: string, start: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default function CandidatePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("");

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    applicationId: number;
    newResult: string;
    label: string;
  } | null>(null);
  const [interviewDialog, setInterviewDialog] = useState<{
    applicationId: number;
    email?: string;
    name?: string;
  } | null>(null);
  const [interviewTime, setInterviewTime] = useState("");
  const [emailDialog, setEmailDialog] = useState<{
    userIds: number[];
    names: string[];
  } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [responseViewer, setResponseViewer] = useState<{
    userId: number;
    name: string;
  } | null>(null);
  const [calendarDialog, setCalendarDialog] = useState<{
    applicationId: number;
    name: string;
    email?: string;
    interviewTime: string;
  } | null>(null);

  const pageSize = 10;
  const debouncedSearch = useDebounce(search, 400);

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: getMyOrganization,
  });
  const orgId = orgData?.data?.organizationId;
  const recruitmentFormId = orgData?.data?.recruitmentFormId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["org-candidates", orgId, page, debouncedSearch, resultFilter],
    queryFn: () =>
      getOrgApplications(orgId!, {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        result: resultFilter || undefined,
      }),
    enabled: !!orgId,
  });

  const { data: responseData, isLoading: responseLoading } = useQuery({
    queryKey: ["candidate-form-response", recruitmentFormId, responseViewer?.userId],
    queryFn: () =>
      getFormResponses({ id: recruitmentFormId!, userId: responseViewer!.userId, limit: 1 }),
    enabled: !!recruitmentFormId && !!responseViewer,
  });
  const candidateResponse: FormResponse | null = responseData?.data?.data?.[0] ?? null;

  const candidates = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const updateMut = useMutation({
    mutationFn: ({ applicationId, result, iTime }: { applicationId: number; result: string; iTime?: string }) =>
      updateClubApplication(applicationId, { result, interviewTime: iTime || null }),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["org-candidates", orgId] });
      setConfirmDialog(null);
      setInterviewDialog(null);
      setInterviewTime("");
      setCalendarDialog(null);
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const notifyMut = useMutation({
    mutationFn: (payload: { userIds: number[]; subject: string; message: string }) =>
      notifyCandidates(orgId!, payload),
    onSuccess: (res) => {
      toast.success(`Đã gửi email cho ${res?.data?.queued ?? 0} người`);
      setEmailDialog(null);
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: () => toast.error("Gửi email thất bại"),
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (appId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === candidates.length && candidates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.applicationId)));
    }
  };

  const openEmailDialog = (subset?: number[]) => {
    const targetIds = subset ?? Array.from(selectedIds);
    const targetCandidates = candidates.filter(
      (c) => targetIds.includes(c.applicationId) && c.user?.userId
    );
    setEmailDialog({
      userIds: targetCandidates.map((c) => c.user!.userId),
      names: targetCandidates.map((c) => c.user?.userName ?? ""),
    });
    setEmailSubject("");
    setEmailMessage("");
  };

  const baseBtn = "w-[100px] text-center py-1 rounded-full text-xs text-white";

  return (
    <div className="px-10 py-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-[#1A73E8] font-bold text-xl">DANH SÁCH ỨNG VIÊN</h1>
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value as ResultFilter); setPage(1); }}
            className="px-3 py-2 rounded-lg border outline-none text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="interview">Phỏng vấn</option>
            <option value="accepted">Đã duyệt</option>
            <option value="rejected">Đã loại</option>
          </select>
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên, email, mssv..."
            className="px-4 py-2 rounded-full bg-gray-100 outline-none w-[260px]"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">
            Đã chọn {selectedIds.size} ứng viên
          </span>
          <button
            onClick={() => openEmailDialog()}
            className="px-3 py-1 bg-[#08667a] text-white text-xs rounded-lg hover:bg-[#06515f]"
          >
            ✉ Gửi email hàng loạt
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-lg"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#e6eaf3] p-4 rounded-xl space-y-3 min-h-[200px]">
        {/* Column header */}
        {!isLoading && candidates.length > 0 && (
          <div className="grid grid-cols-[28px_2fr_2fr_1.5fr_1.2fr_1fr_1fr_1fr_auto] items-center bg-[#c7cde0] px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 gap-2">
            <div>
              <input type="checkbox" checked={selectedIds.size === candidates.length && candidates.length > 0} onChange={toggleAll} className="cursor-pointer" />
            </div>
            <div>Họ tên</div>
            <div>Email</div>
            <div>MSSV</div>
            <div>Nộp đơn</div>
            <div className="text-center">Trạng thái</div>
            <div className="text-center">Duyệt</div>
            <div className="text-center">Từ chối / PV</div>
            <div className="text-center">Thao tác</div>
          </div>
        )}

        {isLoading && <div className="text-center text-gray-500 py-8">Đang tải...</div>}
        {isError && <div className="text-center text-red-500 py-8">Không thể tải danh sách</div>}
        {!isLoading && !isError && candidates.length === 0 && (
          <div className="text-center text-gray-500 py-8">Không có ứng viên nào</div>
        )}

        {candidates.map((c) => {
          const isPending = c.result === "pending";
          const isInterview = c.result === "interview";
          const isAccepted = c.result === "accepted";
          const isRejected = c.result === "rejected";
          const canAct = isPending || isInterview;
          const isSelected = selectedIds.has(c.applicationId);

          return (
            <div
              key={c.applicationId}
              className={`grid grid-cols-[28px_2fr_2fr_1.5fr_1.2fr_1fr_1fr_1fr_auto] items-center px-4 py-3 rounded-lg text-sm gap-2 transition-colors ${
                isSelected ? "bg-blue-50 border border-blue-200" : "bg-white"
              }`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(c.applicationId)}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {c.user?.avatarUrl ? (
                  <Image src={c.user.avatarUrl} alt="avatar" width={32} height={32} className="rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {c.user?.userName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="truncate">{c.user?.userName ?? "—"}</span>
              </div>

              <div className="truncate text-gray-600">{c.user?.email ?? "—"}</div>
              <div className="text-gray-600">{c.user?.studentId ?? "—"}</div>
              <div className="text-gray-500 text-xs">{new Date(c.submittedAt).toLocaleDateString("vi-VN")}</div>

              <div className="flex justify-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${RESULT_COLORS[c.result] ?? "bg-gray-100 text-gray-600"}`}>
                  {RESULT_LABELS[c.result] ?? c.result}
                </span>
              </div>

              {/* Duyệt */}
              <div className="flex justify-center">
                <button
                  disabled={!canAct || isAccepted || updateMut.isPending}
                  onClick={() => setConfirmDialog({ applicationId: c.applicationId, newResult: "accepted", label: "duyệt" })}
                  className={`${baseBtn} ${isAccepted ? "bg-green-600" : !canAct ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                >
                  {isAccepted ? "Đã duyệt" : "Duyệt"}
                </button>
              </div>

              {/* Loại / Phỏng vấn */}
              <div className="flex justify-center gap-1">
                {isRejected ? (
                  <button disabled className={`${baseBtn} bg-red-700 cursor-not-allowed`}>Đã loại</button>
                ) : canAct ? (
                  <>
                    <button
                      disabled={updateMut.isPending}
                      onClick={() => setConfirmDialog({ applicationId: c.applicationId, newResult: "rejected", label: "loại" })}
                      className={`${baseBtn} bg-red-500 hover:bg-red-600`}
                    >
                      Loại
                    </button>
                    {isPending && (
                      <button
                        disabled={updateMut.isPending}
                        onClick={() => setInterviewDialog({
                          applicationId: c.applicationId,
                          email: c.user?.email ?? undefined,
                          name: c.user?.userName ?? undefined,
                        })}
                        className={`${baseBtn} bg-[#4fb3c8] hover:bg-[#3b9db0] ml-1`}
                      >
                        Phỏng vấn
                      </button>
                    )}
                  </>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 justify-center flex-wrap">
                {/* Calendar reminder button — shown for interview-status candidates */}
                {(isInterview || c.interviewTime) && (
                  <button
                    title={c.interviewTime ? `Nhắc lịch: ${new Date(c.interviewTime).toLocaleString("vi-VN")}` : "Đặt lịch nhắc"}
                    onClick={() =>
                      setCalendarDialog({
                        applicationId: c.applicationId,
                        name: c.user?.userName ?? "",
                        email: c.user?.email ?? undefined,
                        interviewTime: c.interviewTime
                          ? new Date(c.interviewTime).toISOString().slice(0, 16)
                          : "",
                      })
                    }
                    className="text-orange-500 hover:text-orange-700 text-base px-1"
                  >
                    📅
                  </button>
                )}
                {/* Email individual */}
                {c.user?.email && (
                  <button
                    title="Gửi email"
                    onClick={() => openEmailDialog([c.applicationId])}
                    className="text-blue-500 hover:text-blue-700 text-base px-1"
                  >
                    ✉
                  </button>
                )}
                {/* View form answers */}
                {recruitmentFormId && c.user?.userId && (
                  <button
                    title="Xem câu trả lời"
                    onClick={() => setResponseViewer({ userId: c.user!.userId, name: c.user?.userName ?? "" })}
                    className="text-[#1A73E8] hover:text-blue-800 text-xs underline whitespace-nowrap"
                  >
                    Trả lời
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:text-gray-300">{"< Trước"}</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 rounded ${page === i + 1 ? "bg-[#08667a] text-white" : ""}`}>{i + 1}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="disabled:text-gray-300">{"Tiếp theo >"}</button>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <div className="text-[#1A73E8] font-bold uppercase">TỔNG SỐ ỨNG VIÊN: {total}</div>
      </div>

      {/* ── Confirm dialog ──────────────────────────────────── */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Bạn có chắc muốn{" "}
              <span className={confirmDialog.newResult === "accepted" ? "text-green-600" : "text-red-500"}>{confirmDialog.label}</span>{" "}
              ứng viên này?
            </h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded-lg bg-gray-300">Hủy</button>
              <button
                disabled={updateMut.isPending}
                onClick={() => updateMut.mutate({ applicationId: confirmDialog.applicationId, result: confirmDialog.newResult })}
                className={`px-4 py-2 rounded-lg text-white disabled:opacity-60 ${confirmDialog.newResult === "accepted" ? "bg-green-500" : "bg-red-500"}`}
              >
                {updateMut.isPending ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interview dialog ────────────────────────────────── */}
      {interviewDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-center text-[#1A73E8]">
              Mời phỏng vấn{interviewDialog.name ? ` — ${interviewDialog.name}` : ""}
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Thời gian phỏng vấn (tuỳ chọn)</label>
              <input
                type="datetime-local"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
              />
            </div>

            {interviewTime && (
              <div className="flex flex-wrap gap-2">
                {/* Open Google Calendar */}
                <a
                  href={buildCalendarUrl(
                    `Phỏng vấn - ${interviewDialog.name ?? "Ứng viên"}`,
                    interviewDialog.email ? `Email: ${interviewDialog.email}` : "",
                    new Date(interviewTime)
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-orange-600 hover:underline"
                >
                  📅 Mở Google Calendar
                </a>
                {/* Send email reminder via queue */}
                {interviewDialog.email && (
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      const dt = new Date(interviewTime).toLocaleString("vi-VN");
                      setEmailDialog({
                        userIds: candidates
                          .filter((c) => c.applicationId === interviewDialog.applicationId && c.user?.userId)
                          .map((c) => c.user!.userId),
                        names: [interviewDialog.name ?? ""],
                      });
                      setEmailSubject("Thư mời phỏng vấn");
                      setEmailMessage(`Bạn được mời tham gia buổi phỏng vấn vào lúc ${dt}.\n\nVui lòng xác nhận tham dự.`);
                    }}
                  >
                    ✉ Soạn email nhắc lịch
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => { setInterviewDialog(null); setInterviewTime(""); }} className="px-4 py-2 bg-gray-300 rounded-lg">Hủy</button>
              <button
                disabled={updateMut.isPending}
                onClick={() => updateMut.mutate({ applicationId: interviewDialog.applicationId, result: "interview", iTime: interviewTime || undefined })}
                className="px-4 py-2 bg-[#4fb3c8] text-white rounded-lg disabled:opacity-60"
              >
                {updateMut.isPending ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email compose dialog ─────────────────────────────── */}
      {emailDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="font-bold text-[#1A73E8] text-lg">Gửi email</h2>
            <p className="text-sm text-gray-500">
              Gửi tới: <span className="font-medium">{emailDialog.names.slice(0, 5).join(", ")}{emailDialog.names.length > 5 ? ` và ${emailDialog.names.length - 5} người khác` : ""}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Tiêu đề</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Tiêu đề email..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Nội dung</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={5}
                  placeholder="Nội dung email..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setEmailDialog(null); setEmailSubject(""); setEmailMessage(""); }}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                disabled={!emailSubject.trim() || !emailMessage.trim() || notifyMut.isPending}
                onClick={() => notifyMut.mutate({ userIds: emailDialog.userIds, subject: emailSubject, message: emailMessage })}
                className="px-4 py-2 bg-[#08667a] text-white rounded-lg text-sm disabled:opacity-60"
              >
                {notifyMut.isPending ? "Đang gửi..." : `Gửi (${emailDialog.userIds.length} người)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar dialog ─────────────────────────────────── */}
      {calendarDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#1A73E8] text-lg">📅 Nhắc lịch phỏng vấn</h2>
              <button onClick={() => setCalendarDialog(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-600">
              Ứng viên: <span className="font-medium">{calendarDialog.name}</span>
              {calendarDialog.email && <span className="text-gray-400 ml-1">({calendarDialog.email})</span>}
            </p>

            {/* Current interview time */}
            {calendarDialog.interviewTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
                Lịch hiện tại:{" "}
                <span className="font-semibold">
                  {new Date(calendarDialog.interviewTime).toLocaleString("vi-VN")}
                </span>
              </div>
            )}

            {/* Change interview time */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                {calendarDialog.interviewTime ? "Thay đổi thời gian" : "Đặt thời gian phỏng vấn"}
              </label>
              <input
                type="datetime-local"
                value={calendarDialog.interviewTime}
                onChange={(e) =>
                  setCalendarDialog((prev) => prev ? { ...prev, interviewTime: e.target.value } : prev)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              {calendarDialog.interviewTime && (
                <>
                  {/* Open Google Calendar */}
                  <a
                    href={buildCalendarUrl(
                      `Phỏng vấn - ${calendarDialog.name}`,
                      calendarDialog.email ? `Ứng viên: ${calendarDialog.name}\nEmail: ${calendarDialog.email}` : `Ứng viên: ${calendarDialog.name}`,
                      new Date(calendarDialog.interviewTime)
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-300 rounded-lg text-sm text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    <span>📅</span>
                    <span>Mở Google Calendar</span>
                  </a>

                  {/* Send email reminder */}
                  {calendarDialog.email && (
                    <button
                      onClick={() => {
                        const dt = new Date(calendarDialog.interviewTime).toLocaleString("vi-VN");
                        const userId = candidates.find(
                          (c) => c.applicationId === calendarDialog.applicationId
                        )?.user?.userId;
                        if (userId) {
                          setEmailDialog({ userIds: [userId], names: [calendarDialog.name] });
                          setEmailSubject("Nhắc lịch phỏng vấn");
                          setEmailMessage(
                            `Xin chào ${calendarDialog.name},\n\nBạn có lịch phỏng vấn vào lúc ${dt}.\n\nVui lòng sắp xếp tham gia đúng giờ. Nếu có thắc mắc, vui lòng phản hồi email này.\n\nTrân trọng.`
                          );
                          setCalendarDialog(null);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <span>✉</span>
                      <span>Gửi email nhắc lịch</span>
                    </button>
                  )}
                </>
              )}

              {/* Save changed time */}
              <div className="flex justify-end gap-2 pt-1 border-t">
                <button
                  onClick={() => setCalendarDialog(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  Đóng
                </button>
                <button
                  disabled={!calendarDialog.interviewTime || updateMut.isPending}
                  onClick={() =>
                    updateMut.mutate({
                      applicationId: calendarDialog.applicationId,
                      result: "interview",
                      iTime: calendarDialog.interviewTime,
                    })
                  }
                  className="px-4 py-2 bg-[#08667a] text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {updateMut.isPending ? "Đang lưu..." : "Lưu thời gian"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Form answers viewer ──────────────────────────────── */}
      {responseViewer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-bold text-[#1A73E8]">Câu trả lời</h2>
                <p className="text-sm text-gray-500">{responseViewer.name}</p>
              </div>
              <button onClick={() => setResponseViewer(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2">×</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              {responseLoading && <p className="text-center text-gray-400 py-8">Đang tải...</p>}
              {!responseLoading && !candidateResponse && (
                <p className="text-center text-gray-400 py-8">Chưa điền biểu mẫu tuyển thành viên.</p>
              )}
              {candidateResponse && <AnswerPanel response={candidateResponse} />}
            </div>
            <div className="px-6 py-3 border-t flex justify-end">
              <button onClick={() => setResponseViewer(null)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
