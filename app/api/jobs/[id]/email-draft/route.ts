import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/db";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "Stdubic/CV";

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  company: string;
  job_url: string;
  raw: string;
}

function parseYamlFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: Record<string, string> = {};
  const yamlLines = match[1].split("\n");
  for (const line of yamlLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2] };
}

function extractEmailBody(markdown: string): string {
  const lines = markdown.split("\n");
  let inBody = false;
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "---" && !inBody) {
      inBody = true;
      continue;
    }
    if (inBody) {
      if (line.startsWith("**Attach:**")) break;
      bodyLines.push(line);
    }
  }

  return bodyLines
    .join("\n")
    .replace(/^\s*Hi,?\s*/i, "Hi,\n\n")
    .trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.application_folder) {
    return NextResponse.json(
      { error: "No application folder yet" },
      { status: 404 }
    );
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GitHub not configured" },
      { status: 500 }
    );
  }

  try {
    const filePath = `applications/${job.application_folder}/email-application.md`;
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
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Email draft not found in repo" },
          { status: 404 }
        );
      }
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    const { frontmatter, body } = parseYamlFrontmatter(content);
    const emailBody = extractEmailBody(body);

    const draft: EmailDraft = {
      to: frontmatter.to || `careers@${job.company.toLowerCase().replace(/\s+/g, "")}.com`,
      subject: frontmatter.subject || `${job.title} — Application`,
      body: emailBody,
      company: frontmatter.company || job.company,
      job_url: frontmatter.job_url || job.url,
      raw: content,
    };

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching email draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch email draft" },
      { status: 500 }
    );
  }
}
