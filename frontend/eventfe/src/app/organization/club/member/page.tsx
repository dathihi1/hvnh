"use client";

import Image from "next/image";
import { useState } from "react";

type Member = {
  name: string;
  phone: string;
  role: string;
};

type FullMember = {
  id: number;
  name: string;
  email: string;
  studentId: string;
  phone: string;
  school: string;
  faculty: string;
  class: string;
  role: string;
  avatar: string;
};

// DATABASE GIẢ
let mockDB: Record<string, FullMember> = {
  "26a4041684@hvnh.edu.vn": {
    id: 1,
    name: "Đào Thị Huyền",
    email: "26a4041684@hvnh.edu.vn",
    phone: "02342432534",
    studentId: "20A401709",
    school: "Học viện Ngân Hàng",
    faculty: "Khoa CNTT&KTS",
    class: "K26HTTTB",
    role: "Thành viên",
    avatar: "/hinh-nen-may-tinh-anime.jpg",
  },
  "test@gmail.com": {
    id: 2,
    name: "Nguyễn Văn B",
    email: "test@gmail.com",
    phone: "0999999999",
    studentId: "20A401710",
    school: "Học viện Ngân Hàng",
    faculty: "Khoa CNTT&KTS",
    class: "K26HTTTB",
    role: "Thành viên",
    avatar: "/hinh-nen-may-tinh-anime.jpg",
  },
};

const mockMembers = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  studentId: "20A401709",
  phone: "0963683209",
  school: "Học viện Ngân Hàng",
  faculty: "Khoa CNTT&KTS",
  class: "K26HTTTB",
  role: "Thành viên",
  avatar: "/hinh-nen-may-tinh-anime.jpg",
}));

export default function ClubMemberPage() {
  const [data, setData] = useState(mockMembers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deletedMember, setDeletedMember] = useState<any>(null);
  const [openAddSuccess, setOpenAddSuccess] = useState(false);
  const [openAddError, setOpenAddError] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [searched, setSearched] = useState(false);
  const [role, setRole] = useState("Thành viên");
  const pageSize = 6;

  const lookupMember = (email: string): FullMember | null => {
    return mockDB[email] ?? null;
  };
  
  const handleDelete = (id: number) => {
    setData((prev) => {
        const found = prev.find((m) => m.id === id);
        setDeletedMember(found);
        return prev.filter((m) => m.id !== id);
    });
  };

  const filtered = data.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

    const totalPage = Math.ceil(filtered.length / pageSize);

    const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const addMemberToDB = async (
    email: string,
    role: string
    ): Promise<FullMember | null> => {
    await new Promise((res) => setTimeout(res, 300));

    const found = mockDB[email];
    if (!found) return null;

    const exists = data.some((m) => m.email === email);
    if (exists) return null;

    return {
        ...found,
        id: Date.now(),
        role,
    };
  };

  return (
    <div className="px-10 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#1A73E8] font-bold text-xl">
            DANH SÁCH THÀNH VIÊN
        </h1>

        <div className="flex gap-3">
            <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="px-4 py-2 rounded-full bg-gray-100 outline-none"
            />

            <button
            onClick={() => setOpenAddModal(true)}
            className="bg-[#08667a] text-white px-4 py-2 rounded-lg"
            >
            Thêm thành viên
            </button>
        </div>
      </div>

      <div className="bg-[#e6eaf3] p-4 rounded-xl space-y-3">
        {paginated.map((m) => (
            <div
            key={m.id}
            className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1.5fr_1.5fr_1fr_1fr] items-center bg-white px-4 py-3 rounded-lg text-sm min-w-0"
            >
            <div className="flex items-center gap-2">
                <Image
                src={m.avatar}
                alt="avatar"
                width={35}
                height={35}
                className="rounded-full"
                />
                {m.name}
            </div>

            <div className="truncate">{m.email}</div>

            <div>{m.studentId}</div>

            <div>{m.phone}</div>

            <div>{m.school}</div>

            <div>{m.faculty}</div>

            <div>{m.class}</div>

            <div>{m.role}</div>

            <div className="flex justify-center">
                <button
                onClick={() => {
                  setSelectedId(m.id);
                  setOpenConfirm(true);
                }}
                className="w-[100px] bg-red-500 text-white py-1 rounded-full text-xs hover:bg-red-600"
                >
                Xóa
                </button>
            </div>
            </div>
        ))}
      </div>
      <div className="flex justify-center mt-6 gap-2 text-sm">
        <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
        >
            {"< Trước"}
        </button>

        {Array.from({ length: totalPage }).map((_, i) => (
            <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 rounded ${
                page === i + 1 ? "bg-[#08667a] text-white" : ""
            }`}
            >
            {i + 1}
            </button>
        ))}

        <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
        >
            {"Tiếp theo >"}
        </button>
      </div>
      <div className="flex justify-end mt-6">
        <div className="text-[#1A73E8] font-bold uppercase">
            TỔNG SỐ THÀNH VIÊN: {filtered.length}
        </div>
      </div>
      {openConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">
                Bạn có chắc muốn xóa thành viên này?
            </h2>

            <div className="flex justify-center gap-4">
                <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
                >
                Hủy
                </button>
                <button
                onClick={() => {
                    if (selectedId !== null) {
                    handleDelete(selectedId);
                    }
                    setOpenConfirm(false);
                    setOpenSuccess(true);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
                >
                Xác nhận
                </button>
            </div>
            </div>
        </div>
        )}
        {openSuccess && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg text-center">
            
            <h2 className="text-lg font-semibold mb-2 text-green-600">
                Đã xóa thành công!
            </h2>

            <p className="text-sm text-gray-600 mb-4">
                Thành viên đã bị xóa khỏi hệ thống
            </p>

            <div className="flex justify-center gap-4">
                <button
                onClick={() => {
                    if (deletedMember) {
                    setData((prev) => [deletedMember, ...prev]);
                    }
                    setOpenSuccess(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#08667a] text-white"
                >
                Hoàn tác
                </button>
                                <button
                onClick={() => setOpenSuccess(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
                >
                Đóng
                </button>
            </div>
            </div>
        </div>
        )}
        {openAddSuccess && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg text-center">
            
            <h2 className="text-lg font-semibold mb-2 text-green-600">
                Thêm thành công!
            </h2>

            <p className="text-sm text-gray-600 mb-4">
                Thành viên đã được thêm vào hệ thống
            </p>

            <button
                onClick={() => setOpenAddSuccess(false)}
                className="px-4 py-2 rounded-lg bg-[#08667a] text-white"
            >
                Đóng
            </button>
            </div>
        </div>
        )}
        {openAddModal && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white w-[400px] rounded-xl p-6 space-y-4">

                <h2 className="text-lg font-bold text-center text-[#1A73E8]">
                    Thêm thành viên
                </h2>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Email thành viên</label>
                    <div className="flex gap-2">
                    <input
                        value={email}
                        onChange={(e) => {
                        setEmail(e.target.value);
                        setSearched(false);
                        setMemberInfo(null);
                        }}
                        placeholder="Nhập email..."
                        className="flex-1 px-3 py-2 border rounded-lg outline-none"
                    />
                    <button
                        onClick={() => {
                        const result = lookupMember(email);
                        setMemberInfo(result);
                        setSearched(true);
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                    >
                        Tìm
                    </button>
                    </div>
                </div>

                {searched && memberInfo && (
                    <div className="border rounded-lg p-3 bg-green-50 text-sm">
                    <div className="font-semibold">{memberInfo.name}</div>
                    <div>{memberInfo.phone}</div>
                    </div>
                )}

                {searched && !memberInfo && (
                    <div className="border rounded-lg p-3 bg-red-50 text-sm text-red-500">
                    Không tìm thấy thành viên
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Chức vụ</label>
                    <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    >
                    <option>Phó CLB</option>
                    <option>Thành viên</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                    onClick={() => setOpenAddModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    >
                    Hủy
                    </button>

                    <button
                    disabled={!memberInfo}
                    onClick={async () => {
                    if (!memberInfo) return;

                    const newMember = await addMemberToDB(email, role);

                    if (newMember) {
                    setData((prev) => [newMember, ...prev]);
                    setOpenAddSuccess(true);
                    } else {
                    setOpenAddError(true);
                    }

                    setOpenAddModal(false);
                    setEmail("");
                    setMemberInfo(null);
                    setSearched(false);
                    setRole("Thành viên");
                    }}
                    className={`px-4 py-2 rounded-lg text-white ${
                        memberInfo ? "bg-[#08667a]" : "bg-gray-300 cursor-not-allowed"
                    }`}
                    >
                    Thêm
                    </button>
                </div>
                </div>
            </div>
            )}
        {openAddError && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg text-center">
            
            <h2 className="text-lg font-semibold mb-2 text-red-600">
                Thêm thất bại!
            </h2>

            <p className="text-sm text-gray-600 mb-4">
                Email đã tồn tại hoặc không hợp lệ
            </p>

            <button
                onClick={() => setOpenAddError(false)}
                className="px-4 py-2 rounded-lg bg-[#08667a] text-white"
            >
                Đóng
            </button>
            </div>
        </div>
        )}
    </div>
  );
}