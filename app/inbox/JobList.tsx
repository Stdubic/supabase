"use client";

import { Job } from "@/lib/db";
import { useState } from "react";

interface JobListProps {
  jobs: Job[];
  showActions?: boolean;
  showFolder?: boolean;
}

export function JobList({ jobs, showActions, showFolder }: JobListProps) {
  return (
    <div className="job-list">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          showActions={showActions}
          showFolder={showFolder}
        />
      ))}
    </div>
  );
}

function JobCard({
  job,
  showActions,
  showFolder,
}: {
  job: Job;
  showActions?: boolean;
  showFolder?: boolean;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${job.id}/${action}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed");
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="job-title"
            >
              {job.title}
            </a>
            <span className={`badge ${getScoreClass(job.score)}`}>
              {job.score}
            </span>
          </div>
          <div className="job-meta">
            <span>{job.company}</span>
            {job.location && <span>{job.location}</span>}
            <span>{job.source}</span>
          </div>
          {job.description && (
            <p className="job-desc">
              {stripHtml(job.description).slice(0, 280)}
              {job.description.length > 280 && "..."}
            </p>
          )}
          {showFolder && job.application_folder && (
            <p style={{ margin: "12px 0 0", fontSize: "14px", color: "#34d399" }}>
              Folder: {job.application_folder}
            </p>
          )}
          {error && <p className="error">{error}</p>}
        </div>

        {showActions && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => handleAction("approve")}
              disabled={loading !== null}
              className="btn btn-approve"
              style={{ opacity: loading && loading !== "approve" ? 0.5 : 1 }}
            >
              {loading === "approve" ? "..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading !== null}
              className="btn btn-reject"
              style={{ opacity: loading && loading !== "reject" ? 0.5 : 1 }}
            >
              {loading === "reject" ? "..." : "Reject"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 50) return "score-high";
  if (score >= 30) return "score-mid";
  if (score >= 0) return "score-low";
  return "score-bad";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
