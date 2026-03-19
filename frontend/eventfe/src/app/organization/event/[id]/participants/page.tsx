"use client";

import Image from "next/image";
import { useState } from "react";

const mockParticipants = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  name: "Nguyễn Văn A",
  email: "abc123@gmail.com",
  studentId: "20A401709",
  phone: "0963683209",
  school: "Học viện Ngân Hàng",
  faculty: "Khoa CNTT&KTS",
  role: "K26HTTTB",
  avatar: "/hinh-nen-may-tinh-anime.jpg",
}));

export default function ParticipantsPage() {
  const [filter, setFilter] = useState("ALL");

  const filteredData =
    filter === "ALL"
      ? mockParticipants
      : mockParticipants.slice(0, 5); // demo

  return (
    <div className="px-10 py-6">
      <h1 className="text-center text-[#1A73E8] text-xl font-bold mb-6">
        DANH SÁCH THAM GIA
      </h1>

      <div className="flex gap-6">
        <div className="flex-1">
          <input
            placeholder="Tìm kiếm theo tên, email, mssv..."
            className="w-full mb-4 px-4 py-2 rounded-full bg-gray-100 outline-none"
          />

          <div className="bg-[#e6eaf3] rounded-xl p-4">
            <div className="space-y-3">
              {filteredData.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-7 items-center bg-white px-4 py-2 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 col-span-2">
                    <Image
                      src={p.avatar}
                      alt="avatar"
                      width={35}
                      height={35}
                      className="rounded-full"
                    />
                    {p.name}
                  </div>

                  <div>{p.email}</div>
                  <div>{p.studentId}</div>
                  <div>{p.phone}</div>
                  <div>{p.school}</div>
                  <div>{p.faculty}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-4 gap-2 text-sm">
              <button>{"< Trước"}</button>
              <button className="bg-[#08667a] text-white px-3 rounded">
                1
              </button>
              <button>2</button>
              <button>3</button>
              <button>{"Tiếp theo >"}</button>
            </div>
          </div>
        </div>

        <div className="w-[200px] flex flex-col gap-4">
          <button className="bg-[#08667a] text-white py-2 rounded-xl">
            Xuất Excel
          </button>

          <button
            onClick={() => setFilter("ALL")}
            className="bg-gray-400 text-white py-2 rounded-xl"
          >
            Tất cả
          </button>

          <button
            onClick={() => setFilter("CHECKIN")}
            className="bg-[#08667a] text-white py-2 rounded-xl"
          >
            Check-in
          </button>

          <button
            onClick={() => setFilter("CHECKOUT")}
            className="bg-[#08667a] text-white py-2 rounded-xl"
          >
            Check-out
          </button>

          <div className="text-right text-[#1A73E8] font-bold mt-4">
            Tổng số tham gia:
            <div className="text-lg">320</div>
          </div>
        </div>
      </div>
    </div>
  );
}