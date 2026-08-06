import { NextResponse } from "next/server";
import { redeemAccessToken } from "@/app/readings-store";

// Where a link from the bot lands.
//
// The exchange cannot happen on the reading page itself: Next only permits
// setting cookies in a Route Handler, Server Action or middleware, never while
// rendering a Server Component. So the bot points here, the token is spent for
// the ownership cookie, and the browser is sent on to the reading at its clean
// address — with the token gone from the URL, out of the address bar, out of
// history, and out of any referrer.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("k");

  if (token) await redeemAccessToken(id, token);

  // Redirect regardless of the outcome. A spent or forged token simply arrives
  // at the reading without a cookie, where the page explains how to recover it
  // — the same screen a stranger with the bare link would see.
  return NextResponse.redirect(new URL(`/r/${id}`, req.url));
}
