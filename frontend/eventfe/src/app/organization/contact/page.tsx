import Image from "next/image";

export default function ContactPage() {
  return (
    <>
      <div className="mb-[50px]">
        <div className="relative h-[250px] mb-[50px]">
          <Image
            src='/Frame.jpg'
            alt='banner'
            fill
            priority
            className="h-full"
          />
        </div>
        <div>
          <h1 className="text-[#05566B] text-[24px] text-center font-bold mb-[20px]">CHÀO MỪNG ĐẾN VỚI HỌC VIỆN NGÂN HÀNG</h1>
          <div className="w-[400px] mx-auto space-y-4">
            <div className="flex gap-[10px]">
              <Image
                src="/phone.png"
                alt='phone'
                width={30}
                height={20}
              />
              (+84)24 35 726 384
            </div>
            <div className="flex gap-[10px]">
              <Image
                src="/email.png"
                alt='email'
                width={30}
                height={20}
              />
              truyenthong@hvnh.edu.vn
            </div>
            <div className="flex gap-[10px]">
              <Image
                src="/website.png"
                alt='phone'
                width={30}
                height={20}
              />
            </div>
            <div className="flex gap-[10px]">
              <Image
                src="/location.png"
                alt='phone'
                width={30}  
                height={20}
              />
              Số 12, đường Chùa Bộc, Quận Đống Đa, Hà Nội
            </div>
          </div>
        </div>
      </div>
    </>
  )
}