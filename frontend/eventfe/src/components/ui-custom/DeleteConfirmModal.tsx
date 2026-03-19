"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-[#0E7490] w-[500px] p-6 rounded-xl text-center text-white">
        <div className="mb-6 text-lg font-semibold">
          Bạn có chắc muốn xóa sự kiện không?
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={onConfirm}
            className="border border-white px-6 py-2 rounded-full"
          >
            CÓ
          </button>

          <button
            onClick={onClose}
            className="border border-white px-6 py-2 rounded-full"
          >
            KHÔNG
          </button>
        </div>
      </div>
    </div>
  );
}