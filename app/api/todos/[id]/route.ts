import { NextResponse } from "next/server";

import { initDb, query } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDb();

  const { id } = await params;
  const body = await request.json();
  const completed = Boolean(body?.completed);

  const { rows } = await query(
    "UPDATE todos SET completed = $1 WHERE id = $2 RETURNING id, text, completed",
    [completed, Number(id)],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDb();

  const { id } = await params;
  const { rows } = await query(
    "DELETE FROM todos WHERE id = $1 RETURNING id, text, completed",
    [Number(id)],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
