"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import DeleteConfirmModal from "@/components/ui-custom//DeleteConfirmModal";

export default function DetailEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const STATUS = [
    "CHUA_BAT_DAU",
    "HET_GIO_CHECKIN",
    "CHECK_OUT",
    "KET_THUC_CHUONG_TRINH",
    "DA_KET_THUC",
  ] as const;
  const [statusIndex, setStatusIndex] = useState(0);
  const handleDelete = async () => {
  try {
    // sau này thay bằng API thật
    console.log("Deleting event id:", id);
    await new Promise((res) => setTimeout(res, 1000));
    router.push("/organization/event");
  } catch (err) {
    console.error(err);
  }
  };
  const STATUS_LABEL: Record<(typeof STATUS)[number], string> = {
    CHUA_BAT_DAU: "Chưa bắt đầu",
    HET_GIO_CHECKIN: "Hết giờ check-in",
    CHECK_OUT: "Check out",
    KET_THUC_CHUONG_TRINH: "Kết thúc chương trình",
    DA_KET_THUC: "Đã kết thúc",
  };
  const handleNextStatus = () => {
    setStatusIndex((prev) => {
      if (prev >= STATUS.length - 1) return prev; // stop ở cuối
      return prev + 1;
    });
  };
  return (
    <div>
      <div className="relative h-[300px] mb-[30px]">
        <Image
          src="/team-building.jpg"
          alt="event"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="flex mx-[150px] gap-[20px] mb-[30px]">
        <div className="w-[400px] bg-white rounded-xl p-6 shadow">
          <div className="font-semibold mb-3">Thông tin chính</div>

          <div>Thời gian:</div>
          <div>Địa điểm:</div>
          <div>Số lượng còn lại:</div>
        </div>

        <div className="flex-1 bg-white p-6 rounded-xl shadow">
          <div className="text-lg font-semibold mb-2">
            TÊN SỰ KIỆN
          </div>

          <div className="mb-2">ĐƠN VỊ TỔ CHỨC</div>

          <div className="text-gray-600">
            MÔ TẢ CHI TIẾT
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-[20px] mb-[40px] flex-wrap">
        <button
          onClick={handleNextStatus}
          className={`px-6 py-3 rounded-xl text-white ${
            statusIndex === STATUS.length - 1
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#05566B]"
          }`}
        >
          {STATUS_LABEL[STATUS[statusIndex]]}
        </button>
        <Link
          href={`/organization/event/${id}/participants`}
          className="bg-[#05566B] text-white px-6 py-3 rounded-xl"
        >
          Quản lý tham gia
        </Link>

        <button onClick={() => setOpenModal(true)}
          className="bg-red-500 text-white px-6 py-3 rounded-xl"
        >
          Xóa sự kiện
        </button>

        <Link
          href={`/organization/event/${id}/edit`}
          className="bg-[#05566B] text-white px-6 py-3 rounded-xl"
        >
          Chỉnh sửa sự kiện
        </Link>
      </div>
      <DeleteConfirmModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
