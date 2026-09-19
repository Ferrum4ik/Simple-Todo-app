import { NextResponse } from "next/server";

import { parseCookies } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.session;

  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
