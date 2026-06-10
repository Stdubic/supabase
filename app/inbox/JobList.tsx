"use client";

import { Job } from "@/lib/db";
import { useState, useEffect, useCallback } from "react";

const GITHUB_REPO = "Stdubic/CV";

interface JobListProps {
  jobs: Job[];
  showActions?: boolean;
  showFolder?: boolean;
  isPreparing?: boolean;
  showApplyAction?: boolean;
  showAppliedInfo?: boolean;
}

export function JobList({
  jobs,
  showActions,
  showFolder,
  isPreparing,
  showApplyAction,
  showAppliedInfo,
}: JobListProps) {
  return (
    <div className="job-list">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          showActions={showActions}
          showFolder={showFolder}
          isPreparing={isPreparing}
          showApplyAction={showApplyAction}
          showAppliedInfo={showAppliedInfo}
        />
      ))}
    </div>
  );
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

function JobCard({
  job,
  showActions,
  showFolder,
  isPreparing,
  showApplyAction,
  showAppliedInfo,
}: {
  job: Job;
  showActions?: boolean;
  showFolder?: boolean;
  isPreparing?: boolean;
  showApplyAction?: boolean;
  showAppliedInfo?: boolean;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);

  // Poll for status change when preparing
  useEffect(() => {
    if (!isPreparing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs?status=approved`);
        if (res.ok) {
          const data = await res.json();
          const stillApproved = data.jobs?.some(
            (j: Job) => j.id === job.id && j.status === "approved"
          );
          if (!stillApproved) {
            window.location.reload();
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isPreparing, job.id]);

  // Fetch email draft when folder is available
  const fetchEmailDraft = useCallback(async () => {
    if (!job.application_folder || emailDraft) return;
    setLoadingDraft(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/email-draft`);
      if (res.ok) {
        const data = await res.json();
        setEmailDraft(data);
      }
    } catch {
      // Draft not available yet
    } finally {
      setLoadingDraft(false);
    }
  }, [job.id, job.application_folder, emailDraft]);

  useEffect(() => {
    if (showFolder && job.application_folder) {
      fetchEmailDraft();
    }
  }, [showFolder, job.application_folder, fetchEmailDraft]);

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

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Failed to copy");
    }
  }

  async function handleMarkApplied(channel: string = "email") {
    setLoading("apply");
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as applied");
      }

      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark as applied");
      setLoading(null);
    }
  }

  function formatDate(isoDate: string | null): string {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function buildMailtoUrl(): string | null {
    if (!emailDraft) return null;
    const params = new URLSearchParams();
    params.set("subject", emailDraft.subject);
    params.set("body", emailDraft.body);
    return `mailto:${encodeURIComponent(emailDraft.to)}?${params.toString()}`;
  }

  const githubFolderUrl = job.application_folder
    ? `https://github.com/${GITHUB_REPO}/tree/main/applications/${job.application_folder}`
    : null;

  const mailtoUrl = buildMailtoUrl();

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

          {/* Prepared job: folder link and actions */}
          {showFolder && job.application_folder && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ fontSize: "14px", color: "#34d399", fontWeight: 500 }}
                >
                  {job.application_folder}
                </span>
                {githubFolderUrl && (
                  <a
                    href={githubFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-small"
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                  >
                    Open on GitHub
                  </a>
                )}
              </div>

              {/* Apply actions */}
              <div
                style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
              >
                {loadingDraft ? (
                  <span style={{ fontSize: "13px", color: "#888" }}>
                    Loading email draft...
                  </span>
                ) : emailDraft ? (
                  <>
                    {mailtoUrl && (
                      <a
                        href={mailtoUrl}
                        className="btn btn-approve"
                        style={{ fontSize: "13px", padding: "6px 12px" }}
                      >
                        Open in Email
                      </a>
                    )}
                    <button
                      onClick={() =>
                        copyToClipboard(emailDraft.body, "email")
                      }
                      className="btn"
                      style={{
                        fontSize: "13px",
                        padding: "6px 12px",
                        background: "#374151",
                      }}
                    >
                      {copied === "email" ? "Copied!" : "Copy Email Body"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(emailDraft.subject, "subject")
                      }
                      className="btn"
                      style={{
                        fontSize: "13px",
                        padding: "6px 12px",
                        background: "#374151",
                      }}
                    >
                      {copied === "subject" ? "Copied!" : "Copy Subject"}
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: "13px", color: "#888" }}>
                    Email draft not available — check GitHub folder
                  </span>
                )}
              </div>

              {/* Mark as Applied button */}
              {showApplyAction && (
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleMarkApplied("email")}
                    disabled={loading !== null}
                    className="btn btn-applied"
                    style={{ fontSize: "13px", padding: "6px 12px" }}
                  >
                    {loading === "apply" ? "..." : "Mark as Applied (Email)"}
                  </button>
                  <button
                    onClick={() => handleMarkApplied("portal")}
                    disabled={loading !== null}
                    className="btn"
                    style={{
                      fontSize: "13px",
                      padding: "6px 12px",
                      background: "#6366f1",
                      color: "#fff",
                    }}
                  >
                    {loading === "apply" ? "..." : "Mark as Applied (Portal)"}
                  </button>
                </div>
              )}

              {/* Applied info */}
              {showAppliedInfo && job.applied_at && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#60a5fa",
                  }}
                >
                  Applied {formatDate(job.applied_at)}
                  {job.apply_channel && ` via ${job.apply_channel}`}
                </p>
              )}
            </div>
          )}

          {/* Preparing indicator */}
          {isPreparing && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "14px",
                color: "#fbbf24",
              }}
            >
              Preparing application... (auto-refreshes)
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
