import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const now = Date.now();
  return NextResponse.json([
    { value: "0.333", bidder: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", time: now - 180000 },
    { value: "0.250", bidder: "0xcafebabecafebabecafebabecafebabecafebabe", time: now - 240000 },
  ]);
}
