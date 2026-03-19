"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateContestPage() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    deadline: "",
    location: "",
    type: "individual",
    max: "",
    min: "",
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mt-6">

      <h1 className="text-center text-xl font-semibold mb-4">
        TẠO MỚI CUỘC THI
      </h1>
        {error && (
        <div className="text-red-500 text-center mb-4">
            {error}
        </div>
        )}
      <div className="flex justify-center gap-6 mb-6">
        <span className={step === 1 ? "text-blue-600" : "text-gray-400"}>
          Bước 1
        </span>
        <span className={step === 2 ? "text-blue-600" : "text-gray-400"}>
          Bước 2
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-4">

          <div>
            <label>Tên cuộc thi:</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
            <div>
                <label className="text-sm">Ảnh đại diện:</label>

                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="upload"
                    onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setImage(file);
                        setPreview(URL.createObjectURL(file));
                    }
                    }}
                />

                <label
                    htmlFor="upload"
                    className="mt-2 w-[200px] h-[120px] bg-gray-200 flex items-center justify-center rounded cursor-pointer overflow-hidden"
                >
                    {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                    ) : (
                    "+"
                    )}
                </label>
            </div>
          <div>
            <label>Mô tả:</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!form.name || !form.description || !image) {
                    setError("Nhập đầy đủ thông tin + chọn ảnh!");
                    return;
                }
                setError("");
                setStep(2);
                }}
              className="bg-teal-700 text-white px-4 py-2 rounded"
            >
              Tiếp theo
            </button>
          </div>

        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">

          <div className="flex gap-4">
            <div className="flex-1">
              <label>Thời gian bắt đầu:</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            <div className="flex-1">
              <label>Thời gian kết thúc:</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
          </div>

          <div>
            <label>Hạn đăng ký:</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => handleChange("deadline", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label>Địa điểm:</label>
            <input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label>Phân loại hoạt động:</label>
            <div className="flex gap-4 mt-1">
              <label>
                <input type="radio" name="activity" /> Học thuật
              </label>
              <label>
                <input type="radio" name="activity" /> Phi học thuật
              </label>
            </div>
          </div>

          <div>
            <label>Hình thức thi:</label>
            <div className="flex gap-4 mt-1">
              <label>
                <input
                  type="radio"
                  checked={form.type === "individual"}
                  onChange={() => handleChange("type", "individual")}
                />
                Cá nhân
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.type === "team"}
                  onChange={() => handleChange("type", "team")}
                />
                Nhóm
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <label>Số lượng tối đa:</label>
              <input
                type="number"
                value={form.max}
                onChange={(e) => handleChange("max", e.target.value)}
                className="border p-2 rounded mt-1 w-[120px]"
              />
            </div>

            <div>
              <label>Số lượng tối thiểu:</label>
              <input
                type="number"
                value={form.min}
                onChange={(e) => handleChange("min", e.target.value)}
                className="border p-2 rounded mt-1 w-[120px]"
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(1)}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              ← Trước
            </button>

            <button
              onClick={() => {
                const { startDate, endDate, deadline, location, max, min } = form;

                if (!startDate || !endDate || !deadline || !location) {
                    setError("Điền đầy đủ thông tin!");
                    return;
                }

                if (new Date(startDate) > new Date(endDate)) {
                    setError("Ngày bắt đầu phải trước ngày kết thúc!");
                    return;
                }
                if (!max || !min || isNaN(Number(max)) || isNaN(Number(min))) {
                    setError("Số lượng phải là số hợp lệ!");
                    return;
                }
                if (new Date(deadline) > new Date(startDate)) {
                    setError("Hạn đăng ký phải trước ngày bắt đầu!");
                    return;
                }

                if (Number(min) > Number(max)) {
                    setError("Số tối thiểu không được lớn hơn tối đa!");
                    return;
                }

                setError("");
                setShowSuccess(true);
                }}
              className="bg-teal-700 text-white px-4 py-2 rounded"
            >
              Tạo mới
            </button>
          </div>
            {showSuccess && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[300px] text-center shadow-lg">
                    
                    <div className="text-green-600 text-3xl mb-2">✔</div>

                    <h2 className="font-semibold mb-2">Tạo mới thành công</h2>

                    <p className="text-sm text-gray-600 mb-4">
                        Cuộc thi của bạn đã được ghi nhận vào hệ thống
                    </p>

                    <button
                        onClick={() => {
                        router.push("/organization/event");
                        }}
                        className="bg-teal-700 text-white px-4 py-2 rounded"
                    >
                        Đồng ý
                    </button>

                    </div>
                </div>
                )}
        </div>
      )}
    </div>
    
  );
}
