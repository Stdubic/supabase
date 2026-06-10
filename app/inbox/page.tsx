import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getJobs } from "@/lib/db";
import { JobList } from "./JobList";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/");
  }

  const pendingJobs = await getJobs("pending");
  const approvedJobs = await getJobs("approved");
  const preparedJobs = await getJobs("prepared");
  const appliedJobs = await getJobs("applied");
  const interviewJobs = await getJobs("interview");

  const hasJobs =
    pendingJobs.length > 0 ||
    approvedJobs.length > 0 ||
    preparedJobs.length > 0 ||
    appliedJobs.length > 0 ||
    interviewJobs.length > 0;

  return (
    <div className="container">
      <header className="header">
        <h1 style={{ margin: 0, fontSize: "28px" }}>Job Inbox</h1>
        <div className="stats">
          <span className="stat-pending">{pendingJobs.length} pending</span>
          <span className="stat-approved">{approvedJobs.length} preparing</span>
          <span className="stat-prepared">{preparedJobs.length} ready</span>
          <span className="stat-applied">{appliedJobs.length} applied</span>
          {interviewJobs.length > 0 && (
            <span className="stat-interview">{interviewJobs.length} interview</span>
          )}
        </div>
      </header>

      {!hasJobs ? (
        <div className="empty-state">
          <p style={{ fontSize: "18px" }}>No jobs yet</p>
          <p style={{ fontSize: "14px" }}>
            n8n workflow sends new jobs daily at 08:00 — or use test ingest
          </p>
        </div>
      ) : (
        <>
          {pendingJobs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 className="section-title stat-pending">Pending Review</h2>
              <JobList jobs={pendingJobs} showActions />
            </section>
          )}

          {approvedJobs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 className="section-title stat-approved">
                Preparing...
              </h2>
              <JobList jobs={approvedJobs} isPreparing />
            </section>
          )}

          {preparedJobs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 className="section-title stat-prepared">Ready to Apply</h2>
              <JobList jobs={preparedJobs} showFolder showApplyAction />
            </section>
          )}

          {appliedJobs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 className="section-title stat-applied">Applied</h2>
              <JobList jobs={appliedJobs} showFolder showAppliedInfo />
            </section>
          )}

          {interviewJobs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 className="section-title stat-interview">Interview</h2>
              <JobList jobs={interviewJobs} showFolder />
            </section>
          )}
        </>
      )}
    </div>
  );
}
