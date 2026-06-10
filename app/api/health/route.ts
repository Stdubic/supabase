import { NextResponse } from "next/server";

export async function GET() {
  const configured = {
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    github: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
    webhook: !!process.env.N8N_WEBHOOK_SECRET,
    dashboard: !!process.env.DASHBOARD_PASSWORD,
  };

  return NextResponse.json({
    status: "ok",
    service: "job-agent",
    configured,
    timestamp: new Date().toISOString(),
  });
}
