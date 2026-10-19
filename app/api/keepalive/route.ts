import { NextResponse } from "next/server";
import { db } from "@/app/db";

// Supabase's free tier pauses a project after a week without database activity.
// A daily Vercel cron (vercel.json) runs one real query here to keep it awake.
//
// Vercel signs cron requests with CRON_SECRET when it is set, so anyone else
// hitting this endpoint is turned away.

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  await db.reading.findFirst({ select: { id: true } });
  return NextResponse.json({ ok: true });
}
