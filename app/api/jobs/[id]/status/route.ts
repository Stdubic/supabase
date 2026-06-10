import { NextRequest, NextResponse } from "next/server";
import { verifyCallbackSecret, isAuthenticated } from "@/lib/auth";
import { getJob, updateJobStatus, JobStatus } from "@/lib/db";

const CALLBACK_STATUSES: JobStatus[] = ["prepared", "failed"];
const USER_STATUSES: JobStatus[] = ["applied", "interview", "offer", "declined", "withdrawn"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isCallback = verifyCallbackSecret(request);
  const isUser = await isAuthenticated();

  if (!isCallback && !isUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, application_folder, github_commit_sha, applied_at, apply_channel } = body;

    const allowedStatuses = isCallback ? CALLBACK_STATUSES : USER_STATUSES;
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const job = await getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await updateJobStatus(id, status, {
      application_folder,
      github_commit_sha,
      applied_at,
      apply_channel,
    });

    return NextResponse.json({
      success: true,
      job: updated,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
