import Image from "next/image";

type Member = {
  id: string;
  name: string;
  faculty: string;
  class: string;
  role: string;
};

const mockMembers: Member[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i),
  name: "Nguyễn Văn A",
  faculty: "Khoa CNTT và Kinh tế số",
  class: "26A4041709",
  role: i === 0 ? "Chủ nhiệm" : i === 1 ? "Phó chủ nhiệm" : "Thành viên",
}));

export default async function ClubMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="px-[40px] py-[30px]">
      <div className="mb-[20px]">
        <input
          placeholder="Tìm kiếm theo tên, lớp, khoa, vai trò"
          className="w-[300px] px-4 py-2 rounded-full bg-gray-100 outline-none"
        />
      </div>

      <h1 className="text-center text-[#1A73E8] text-[20px] font-bold mb-[20px]">
        DANH SÁCH THÀNH VIÊN CLB {id.toUpperCase()}
      </h1>

      <div className="bg-[#E5E7EB] rounded-[10px] p-[20px]">
        <div className="grid grid-cols-4 font-bold mb-[10px]">
          <div>HỌ TÊN</div>
          <div>KHOA</div>
          <div>LỚP</div>
          <div>VAI TRÒ</div>
        </div>

        {mockMembers.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-4 items-center py-3 border-t"
          >
            <div className="flex items-center gap-3">
              <Image
                src="/hinh-nen-may-tinh-anime.jpg"
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span>{m.name}</span>
            </div>

            <div>{m.faculty}</div>
            <div>{m.class}</div>

            <div className="font-semibold">
              {m.role}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-[20px] gap-3">
        <button>{"< Trước"}</button>
        <button className="font-bold">1</button>
        <button>2</button>
        <button>3</button>
        <button>{"Tiếp theo >"}</button>
      </div>
    </div>
  );
}