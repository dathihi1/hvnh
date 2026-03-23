import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { rememberMe, ...credentials } = body;

  const res = await http.post(`${envConfig.NEXT_PUBLIC_API_URL}/auth/login`, credentials) as any;

  if (!res?.success) {
    return NextResponse.json(
      { code: res?.code, message: res?.message },
      { status: 401 }
    );
  }

  const { user, accessToken, refreshToken } = res.data;

  const isProd = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true, user });

  // Access token: non-httpOnly so client JS can read for Authorization header
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
    maxAge: Number(envConfig.COOKIE_REFRESH_TOKEN_MAX_AGE) || 2592000,
    path: "/",
    sameSite: "lax",
  });

  // Refresh token: persistent if rememberMe, session cookie otherwise
  const refreshCookieOptions: Parameters<typeof response.cookies.set>[2] = {
    httpOnly: true,
    secure: isProd,
    path: "/",
    sameSite: "lax",
    ...(rememberMe && { maxAge: Number(envConfig.COOKIE_REFRESH_TOKEN_MAX_AGE) || 2592000 }),
  };
  response.cookies.set("refresh_token", refreshToken, refreshCookieOptions);

  return response;
}
