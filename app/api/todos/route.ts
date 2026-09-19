import { NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

type TodoRow = {
  id: number;
  text: string;
  completed: boolean;
};

export async function GET(request: Request) {
  await initDb();

  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query<TodoRow>(
    "SELECT id, text, completed FROM todos WHERE user_id = $1 ORDER BY id DESC",
    [user.id],
  );

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await initDb();

  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = String(body?.text ?? "").trim();

  if (!text) {
    return NextResponse.json(
      { error: "Todo text is required." },
      { status: 400 },
    );
  }

  const { rows } = await query<TodoRow>(
    "INSERT INTO todos (text, completed, user_id) VALUES ($1, false, $2) RETURNING id, text, completed",
    [text, user.id],
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(request: Request) {
  await initDb();

  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query<TodoRow>(
    "DELETE FROM todos WHERE completed = true AND user_id = $1 RETURNING id, text, completed",
    [user.id],
  );

  return NextResponse.json(rows);
}
