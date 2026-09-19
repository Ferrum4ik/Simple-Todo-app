import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

export async function POST(request: Request) {
  await initDb();

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 },
    );
  }

  const existing = await query(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );

  if (existing.rowCount && existing.rowCount > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const { hash, salt } = hashPassword(password);

  const { rows } = await query(
    "INSERT INTO users (name, email, password_hash, password_salt) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
    [name, email, hash, salt],
  );

  return NextResponse.json(rows[0], { status: 201 });
}
