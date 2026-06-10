import { NextRequest, NextResponse } from "next/server";
import { setAuthenticated } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const correctPassword = process.env.DASHBOARD_PASSWORD;

    if (!correctPassword || password !== correctPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setAuthenticated();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
