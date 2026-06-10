const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || "dub1c/cv";

export interface DispatchPayload {
  jobId: string;
  title: string;
  company: string;
  url: string;
  description: string;
  location?: string;
  source: string;
}

export async function triggerPrepareApplication(
  payload: DispatchPayload
): Promise<boolean> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "prepare-application",
        client_payload: payload,
      }),
    }
  );

  return response.ok;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export interface MarkAppliedPayload {
  jobId: string;
  title: string;
  company: string;
  url: string;
  application_folder: string;
  applied_at: string;
  channel: string;
}

export async function triggerMarkApplied(
  payload: MarkAppliedPayload
): Promise<boolean> {
  if (!GITHUB_TOKEN) return false;

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "mark-applied",
        client_payload: payload,
      }),
    }
  );

  return response.ok;
}
