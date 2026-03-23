import { envConfig } from "@/configs/env.config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ success: false, message: "Missing code" }, { status: 400 });
  }

  const res = await fetch(`${envConfig.NEXT_PUBLIC_API_URL}/auth/google/exchange?code=${code}`);
  const data = await res.json() as any;

  if (!data?.success) {
    return NextResponse.json(
      { success: false, message: data?.message || "Invalid or expired code" },
      { status: 400 }
    );
  }

  const { user, accessToken, refreshToken } = data.data;
  const isProd = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true, user });

  response.cookies.set("access_token", accessToken, {
    httpOnly: false,
    secure: isProd,
    maxAge: Number(envConfig.COOKIE_ACCESS_TOKEN_MAX_AGE) || 1800,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set("user_role", user.role ?? "student", {
    httpOnly: false,
    secure: isProd,
    maxAge: Number(envConfig.COOKIE_ACCESS_TOKEN_MAX_AGE) || 1800,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    maxAge: Number(envConfig.COOKIE_REFRESH_TOKEN_MAX_AGE) || 2592000,
    path: "/api/auth",
    sameSite: "strict",
  });

  return response;
}
