import { NextResponse } from "next/server";

import { createSessionToken, verifyPassword } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
};

export async function POST(request: Request) {
  await initDb();

  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const { rows } = await query<UserRow>(
    "SELECT id, name, email, password_hash, password_salt FROM users WHERE email = $1",
    [email],
  );

  const user = rows[0] as UserRow | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const isValid = verifyPassword(password, user.password_hash, user.password_salt);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, token, expiresAt],
  );

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
