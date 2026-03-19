"use client";

import Image from "next/image";
import { useState } from "react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

const mockCandidates = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  name: "Nguyễn Văn A",
  email: "maildan07022005@gmail.com",
  class: "K26HTTTB",
  major: "CNTT và Kinh tế số",
  avatar: "/hinh-nen-may-tinh-anime.jpg",
  status: "PENDING" as Status,
  interviewed: false,
}));

export default function CandidatePage() {
  const [data, setData] = useState(mockCandidates);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const updateStatus = (id: number, newStatus: Status) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: newStatus } : c
      )
    );
  };

  const inviteInterview = (id: number) => {
    setData((prev) =>
        prev.map((c) =>
        c.id === id ? { ...c, interviewed: true } : c
        )
    );
  };
  const baseBtn =
    "w-[110px] text-center py-1 rounded-full text-xs text-white";
  return (
    <div className="px-10 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#1A73E8] font-bold text-xl">
          DANH SÁCH ỨNG TUYỂN
        </h1>

        <input
          placeholder="Tìm ứng viên theo tên, email, mssv"
          className="px-4 py-2 rounded-full bg-gray-100 outline-none w-[300px]"
        />
      </div>

      <div className="bg-[#e6eaf3] p-4 rounded-xl space-y-3">
        {data.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1fr_1fr_1fr] items-center bg-white px-4 py-3 rounded-lg text-sm min-w-0"
          >
            <div className="flex items-center gap-2">
              <Image
                src={c.avatar}
                alt="avatar"
                width={35}
                height={35}
                className="rounded-full"
              />
              {c.name}
            </div>

            <div className="truncate max-w-[180px]">{c.email}</div>
            <div>{c.class}</div>
            <div>{c.major}</div>

            <div className="flex justify-center">
              <button
                disabled={c.status === "REJECTED" || c.status === "APPROVED"}
                onClick={() => updateStatus(c.id, "APPROVED")}
                className={`${baseBtn} ${
                    c.status === "APPROVED"
                    ? "bg-green-600"
                    : c.status === "REJECTED"
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-500"
                }`}
                >
                {c.status === "APPROVED" ? "Đã duyệt" : "Duyệt"}
                </button>
            </div>

            <div className="flex justify-center">
            <button
                disabled={c.status === "APPROVED" || c.status === "REJECTED"}
                onClick={() => {
                    setSelectedId(c.id);
                    setOpenConfirm(true);
                }}
                className={`${baseBtn} ${
                    c.status === "REJECTED"
                    ? "bg-red-700"
                    : c.status === "APPROVED"
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500"
                }`}
                >
                {c.status === "REJECTED" ? "Đã loại" : "Loại"}
            </button>
            </div>

            <div className="flex justify-center">
              {c.status !== "APPROVED" ? (
                <span className="text-gray-400 text-xs">
                  Chưa duyệt
                </span>
              ) : (
                <button
                    disabled={c.interviewed}
                    onClick={() => inviteInterview(c.id)}
                    className={`${baseBtn} ${
                        c.interviewed
                        ? "bg-[#3b7c8a] cursor-not-allowed"
                        : "bg-[#4fb3c8]"
                    }`}
                    >
                    {c.interviewed ? "Đã mời phỏng vấn" : "Mời phỏng vấn"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6 gap-3 text-sm">
        <button>{"< Trước"}</button>
        <button className="bg-[#08667a] text-white px-3 rounded">1</button>
        <button>2</button>
        <button>3</button>
        <button>{"Tiếp theo >"}</button>
      </div>
      {openConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">
                Bạn có chắc muốn loại ứng viên này?
            </h2>

            <div className="flex justify-center gap-4">
                <button
                onClick={() => {
                    if (selectedId !== null) {
                    updateStatus(selectedId, "REJECTED");
                    }
                    setOpenConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
                >
                Xác nhận
                </button>

                <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
                >
                Hủy
                </button>
            </div>
            </div>
        </div>
        )}
    </div>  
  );
}