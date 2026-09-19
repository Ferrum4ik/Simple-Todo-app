import { NextResponse } from "next/server";

import { initDb, query } from "@/lib/db";

export async function GET() {
  await initDb();

  const { rows } = await query(
    "SELECT id, text, completed FROM todos ORDER BY id DESC",
  );

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await initDb();

  const body = await request.json();
  const text = String(body?.text ?? "").trim();

  if (!text) {
    return NextResponse.json(
      { error: "Todo text is required." },
      { status: 400 },
    );
  }

  const { rows } = await query(
    "INSERT INTO todos (text, completed) VALUES ($1, false) RETURNING id, text, completed",
    [text],
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE() {
  await initDb();

  const { rows } = await query(
    "DELETE FROM todos WHERE completed = true RETURNING id, text, completed",
  );

  return NextResponse.json(rows);
}
