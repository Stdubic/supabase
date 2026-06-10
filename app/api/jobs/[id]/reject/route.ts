import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getJob, updateJobStatus } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const job = await getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "pending") {
      return NextResponse.json(
        { error: `Job already ${job.status}` },
        { status: 400 }
      );
    }

    const updated = await updateJobStatus(id, "rejected");

    return NextResponse.json({
      success: true,
      job: updated,
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
