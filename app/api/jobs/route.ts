import { NextRequest, NextResponse } from "next/server";
import { getJobs, getKnownUrls } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || undefined;
  const urlsOnly = searchParams.get("urls_only") === "true";

  try {
    if (urlsOnly) {
      const urls = await getKnownUrls();
      return NextResponse.json({ urls });
    }

    const jobs = await getJobs(status);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
