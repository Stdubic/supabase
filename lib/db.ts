import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase not configured - set SUPABASE_URL and SUPABASE_SERVICE_KEY");
  }
  return client;
}

function isConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
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
  if (!isConfigured()) return [];
  
  let query = requireSupabase()
    .from("jobs")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getJob(id: string): Promise<Job | null> {
  if (!isConfigured()) return null;
  
  const { data, error } = await requireSupabase()
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getKnownUrls(): Promise<string[]> {
  if (!isConfigured()) return [];
  
  const { data, error } = await requireSupabase().from("jobs").select("url");
  if (error) throw error;
  return (data || []).map((j) => j.url);
}

export async function insertJobs(
  jobs: Omit<Job, "id" | "created_at" | "updated_at">[]
): Promise<{ inserted: number; duplicates: number }> {
  let inserted = 0;
  let duplicates = 0;

  const client = requireSupabase();
  for (const job of jobs) {
    const { error } = await client.from("jobs").insert(job);
    if (error) {
      if (error.code === "23505") {
        duplicates++;
      } else {
        console.error("Insert error:", error);
      }
    } else {
      inserted++;
    }
  }

  return { inserted, duplicates };
}

export async function updateJobStatus(
  id: string,
  status: Job["status"],
  extra?: Partial<Pick<Job, "application_folder" | "github_commit_sha">>
): Promise<Job | null> {
  const { data, error } = await requireSupabase()
    .from("jobs")
    .update({ status, ...extra })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
