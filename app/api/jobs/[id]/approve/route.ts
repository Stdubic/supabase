import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJobStatus } from "@/lib/db";
import { triggerPrepareApplication, slugify } from "@/lib/github";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const success = await triggerPrepareApplication({
      jobId: job.id,
      title: job.title,
      company: job.company,
      url: job.url,
      description: job.description || "",
      location: job.location || undefined,
      source: job.source,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to trigger GitHub Action" },
        { status: 500 }
      );
    }

    const updated = await updateJobStatus(id, "approved");

    return NextResponse.json({
      success: true,
      job: updated,
      message: "Application preparation triggered",
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
