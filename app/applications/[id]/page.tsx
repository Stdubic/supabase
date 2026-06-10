import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getJob } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/");
  }

  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    pending: "#fbbf24",
    approved: "#60a5fa",
    prepared: "#34d399",
    rejected: "#888",
    failed: "#ef4444",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <a
        href="/inbox"
        style={{
          display: "inline-block",
          marginBottom: "24px",
          color: "#888",
          textDecoration: "none",
        }}
      >
        ← Back to Inbox
      </a>

      <h1 style={{ marginBottom: "8px", fontSize: "28px" }}>{job.title}</h1>
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          color: "#888",
        }}
      >
        <span>{job.company}</span>
        {job.location && <span>{job.location}</span>}
        <span style={{ color: statusColors[job.status] }}>{job.status}</span>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: "8px 16px",
            fontSize: "14px",
          }}
        >
          <span style={{ color: "#888" }}>Source</span>
          <span>{job.source}</span>

          <span style={{ color: "#888" }}>URL</span>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#60a5fa" }}
          >
            {job.url}
          </a>

          <span style={{ color: "#888" }}>Score</span>
          <span>{job.score}</span>

          {job.salary && (
            <>
              <span style={{ color: "#888" }}>Salary</span>
              <span>{job.salary}</span>
            </>
          )}

          {job.application_folder && (
            <>
              <span style={{ color: "#888" }}>Folder</span>
              <span style={{ color: "#34d399" }}>{job.application_folder}</span>
            </>
          )}

          {job.github_commit_sha && (
            <>
              <span style={{ color: "#888" }}>Commit</span>
              <code style={{ fontSize: "12px" }}>
                {job.github_commit_sha.slice(0, 7)}
              </code>
            </>
          )}
        </div>
      </div>

      {job.description && (
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Description
          </h2>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              fontSize: "14px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{
              __html: job.description.replace(/\n/g, "<br>"),
            }}
          />
        </div>
      )}
    </div>
  );
}
