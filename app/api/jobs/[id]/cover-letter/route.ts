import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/db";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "Stdubic/CV";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await getJob(id);
  if (!job?.application_folder) {
    return NextResponse.json({ error: "No application folder" }, { status: 404 });
  }
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 500 });
  }

  try {
    const filePath = `applications/${job.application_folder}/cover-letter.md`;
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return NextResponse.json({ content, folder: job.application_folder });
  } catch (error) {
    console.error("Cover letter fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
