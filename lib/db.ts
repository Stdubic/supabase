import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  isBlobConfigured,
  blobGetJobs,
  blobGetJob,
  blobGetKnownUrls,
  blobInsertJobs,
  blobUpdateJobStatus,
} from "./blob-db";

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

function useSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function requireStore(): "supabase" | "blob" {
  if (useSupabase()) return "supabase";
  if (isBlobConfigured()) return "blob";
  throw new Error(
    "No storage configured - set SUPABASE_URL + SUPABASE_SERVICE_KEY or link Vercel Blob"
  );
}

export interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  description: string | null;
  source: string;
  location: string | null;
  salary: string | null;
  score: number;
  status: "pending" | "approved" | "rejected" | "prepared" | "failed";
  application_folder: string | null;
  github_commit_sha: string | null;
  created_at: string;
  updated_at: string;
}

export async function getJobs(status?: string): Promise<Job[]> {
  try {
    if (useSupabase()) {
      let query = getSupabase()!
        .from("jobs")
        .select("*")
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    if (isBlobConfigured()) return blobGetJobs(status);
    return [];
  } catch {
    return [];
  }
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    if (useSupabase()) {
      const { data, error } = await getSupabase()!
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }
    if (isBlobConfigured()) return blobGetJob(id);
    return null;
  } catch {
    return null;
  }
}

export async function getKnownUrls(): Promise<string[]> {
  try {
    if (useSupabase()) {
      const { data, error } = await getSupabase()!.from("jobs").select("url");
      if (error) throw error;
      return (data || []).map((j) => j.url);
    }
    if (isBlobConfigured()) return blobGetKnownUrls();
    return [];
  } catch {
    return [];
  }
}

export async function insertJobs(
  jobs: Omit<Job, "id" | "created_at" | "updated_at">[]
): Promise<{ inserted: number; duplicates: number }> {
  const store = requireStore();

  if (store === "supabase") {
    let inserted = 0;
    let duplicates = 0;
    const client = getSupabase()!;
    for (const job of jobs) {
      const { error } = await client.from("jobs").insert(job);
      if (error) {
        if (error.code === "23505") duplicates++;
        else console.error("Insert error:", error);
      } else {
        inserted++;
      }
    }
    return { inserted, duplicates };
  }

  return blobInsertJobs(jobs);
}

export async function updateJobStatus(
  id: string,
  status: Job["status"],
  extra?: Partial<Pick<Job, "application_folder" | "github_commit_sha">>
): Promise<Job | null> {
  const store = requireStore();

  if (store === "supabase") {
    const { data, error } = await getSupabase()!
      .from("jobs")
      .update({ status, ...extra })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return blobUpdateJobStatus(id, status, extra);
}
