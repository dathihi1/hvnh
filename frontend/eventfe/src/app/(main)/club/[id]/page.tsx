import Image from "next/image";
import Link from "next/link";

export default async function DetailClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <div className="relative h-[300px] mb-[35px]">
        <Image
          src="/team-building.jpg"
          alt="team-building"
          fill
          priority
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="flex justify-around">
        <Image
          src="/team-building.jpg"
          alt="team-building"
          width={1200}
          height={400}
          className="w-[510px] h-[288] rounded-[29px]"
        />
        <div className="flex flex-col items-center gap-[15px]">
          <Image
            src="/logo-club.jpg"
            alt="logo-club"
            width={150}
            height={150}
            className="rounded-full"
          />
          <div className="text-[#1A73E8] text-[28px] font-bold">BIT - CLB TIN HỌC NGÂN HÀNG</div>
        </div>
        <Image
          src="/team-building.jpg"
          alt="team-building"
          width={1200}
          height={400}
          className="w-[510px] h-[288] rounded-[29px]" />
      </div>
      <div className="flex items-center w-full my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
        <div className="px-0">
          <span className="bg-[#08667a] text-white px-8 py-2 rounded-full font-bold text-[16px] whitespace-nowrap uppercase tracking-wider">
            Giới thiệu
          </span>
        </div>
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
      </div>
      <div className="mx-[20px] rounded-[20px] border-[3px] border-[#1A73E8] p-[20px] h-[600px]">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Cum facilis, vel voluptatibus possimus esse quidem est repellat sequi quasi, assumenda dolor, aspernatur laudantium quam voluptatum nisi numquam velit odio? Facilis!
      </div>
      <div className="flex items-center w-full my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
        <div className="px-0">
          <span className="bg-[#08667a] text-white px-8 py-2 rounded-full font-bold text-[16px] whitespace-nowrap uppercase tracking-wider">
            Liên hệ
          </span>
        </div>
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
      </div>
      <div className="mx-[20px] rounded-[12px] border-[3px] border-[#1A73E8] p-[20px] h-[200px] mb-[30px] space-y-[15px]">
        <div className="text-[16px] font-bold">Tiktok: </div>
        <div className="text-[16px] font-bold">Email: </div>
        <div className="text-[16px] font-bold">Facebook: </div>
        <div className="text-[16px] font-bold">Số điện thoại: </div>
      </div>
      <h1 className="mb-[30px] text-[24px] font-bold text-center text-[#1A73E8]">CÂU LẠC BỘ HIỆN KHÔNG MỞ ĐƠN TUYỂN THÀNH VIÊN!</h1>
      <div className="flex justify-center mt-4">
      <Link
        href={`/club/${id}/member`}
        className="mt-2 bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition"
      >
        Xem thành viên
      </Link>
      </div>
    </div>
  )
}