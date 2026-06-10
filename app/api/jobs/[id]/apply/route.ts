import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getJob, updateJobStatus } from "@/lib/db";
import { triggerMarkApplied } from "@/lib/github";

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
    const body = await request.json().catch(() => ({}));
    const channel = body.channel || "email";

    const job = await getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "prepared") {
      return NextResponse.json(
        { error: "Can only mark prepared jobs as applied" },
        { status: 400 }
      );
    }

    const appliedAt = new Date().toISOString();

    const updated = await updateJobStatus(id, "applied", {
      applied_at: appliedAt,
      apply_channel: channel,
    });

    // Trigger GitHub Action to update tracker (fire and forget)
    if (job.application_folder) {
      triggerMarkApplied({
        jobId: job.id,
        title: job.title,
        company: job.company,
        url: job.url,
        application_folder: job.application_folder,
        applied_at: appliedAt,
        channel,
      }).catch((err) => console.error("Failed to trigger mark-applied:", err));
    }

    return NextResponse.json({
      success: true,
      job: updated,
    });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json(
      { error: "Failed to mark as applied" },
      { status: 500 }
    );
  }
}
