import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret } from "@/lib/auth";
import { insertJobs, getKnownUrls, Job } from "@/lib/db";
import { scoreJob, shouldIncludeJob } from "@/lib/scoring";

interface IngestJobPayload {
  title: string;
  company: string;
  url: string;
  description?: string;
  source: string;
  location?: string;
  salary?: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const jobs: IngestJobPayload[] = Array.isArray(payload)
      ? payload
      : [payload];

    const knownUrls = new Set(await getKnownUrls());

    const newJobs: Omit<Job, "id" | "created_at" | "updated_at">[] = [];

    for (const job of jobs) {
      if (!job.url || !job.title || !job.company) continue;
      if (knownUrls.has(job.url)) continue;

      const desc = job.description || "";
      if (!shouldIncludeJob(job.title, desc, job.category)) continue;

      const { score } = scoreJob(job.title, desc, job.location);

      newJobs.push({
        title: job.title,
        company: job.company,
        url: job.url,
        description: desc || null,
        source: job.source,
        location: job.location || null,
        salary: job.salary || null,
        score,
        status: "pending",
        application_folder: null,
        github_commit_sha: null,
      });
    }

    const result = await insertJobs(newJobs);

    return NextResponse.json({
      success: true,
      received: jobs.length,
      inserted: result.inserted,
      duplicates: result.duplicates,
      filtered: jobs.length - newJobs.length - result.duplicates,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to process jobs" },
      { status: 500 }
    );
  }
}
