import { list, put } from "@vercel/blob";
import { Job } from "./db";

const INDEX_PATH = "jobs/index.json";

function hasBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function readIndex(): Promise<Job[]> {
  if (!hasBlob()) return [];

  try {
    const { blobs } = await list({ prefix: "jobs/", limit: 1 });
    const indexBlob = blobs.find((b) => b.pathname === INDEX_PATH);
    if (!indexBlob) return [];

    const res = await fetch(indexBlob.url);
    if (!res.ok) return [];
    return (await res.json()) as Job[];
  } catch {
    return [];
  }
}

async function writeIndex(jobs: Job[]): Promise<void> {
  if (!hasBlob()) throw new Error("Blob storage not configured");

  await put(INDEX_PATH, JSON.stringify(jobs), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function newId(): string {
  return crypto.randomUUID();
}

export function isBlobConfigured(): boolean {
  return hasBlob();
}

export async function blobGetJobs(status?: string): Promise<Job[]> {
  const jobs = await readIndex();
  const filtered = status ? jobs.filter((j) => j.status === status) : jobs;
  return filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function blobGetJob(id: string): Promise<Job | null> {
  const jobs = await readIndex();
  return jobs.find((j) => j.id === id) || null;
}

export async function blobGetKnownUrls(): Promise<string[]> {
  const jobs = await readIndex();
  return jobs.map((j) => j.url);
}

export async function blobInsertJobs(
  newJobs: Omit<Job, "id" | "created_at" | "updated_at">[]
): Promise<{ inserted: number; duplicates: number }> {
  const jobs = await readIndex();
  const knownUrls = new Set(jobs.map((j) => j.url));
  let inserted = 0;
  let duplicates = 0;
  const now = new Date().toISOString();

  for (const job of newJobs) {
    if (knownUrls.has(job.url)) {
      duplicates++;
      continue;
    }
    jobs.push({
      ...job,
      id: newId(),
      created_at: now,
      updated_at: now,
    });
    knownUrls.add(job.url);
    inserted++;
  }

  await writeIndex(jobs);
  return { inserted, duplicates };
}

export async function blobUpdateJobStatus(
  id: string,
  status: Job["status"],
  extra?: Partial<Pick<Job, "application_folder" | "github_commit_sha">>
): Promise<Job | null> {
  const jobs = await readIndex();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  jobs[idx] = {
    ...jobs[idx],
    status,
    ...extra,
    updated_at: new Date().toISOString(),
  };

  await writeIndex(jobs);
  return jobs[idx];
}
