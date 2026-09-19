import { NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

type TodoRow = {
  id: number;
  text: string;
  completed: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDb();

  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const completed = Boolean(body?.completed);

  const { rows } = await query<TodoRow>(
    "UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING id, text, completed",
    [completed, Number(id), user.id],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDb();

  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { rows } = await query<TodoRow>(
    "DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id, text, completed",
    [Number(id), user.id],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
