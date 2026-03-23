import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await http.post(`${envConfig.NEXT_PUBLIC_API_URL}/auth/reset-password`, body) as any;

  if (!res?.success) {
    return NextResponse.json(
      { success: false, message: res?.message || "Có lỗi xảy ra" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
