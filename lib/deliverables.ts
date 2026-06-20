import { getDb } from "./cf";
import { listOrgs, getSubmissionFiles } from "./queries";
import type { Org, SubmissionFile, TaskCategory } from "./types";

/**
 * Public, non-PII view of a published civic deliverable.
 *
 * IMPORTANT: this shape deliberately excludes ALL recipient PII (no user id,
 * legal name, full name, case number, address). A published deliverable shows
 * only the work and the sponsoring organization. The volunteer who produced it
 * is never named — see docs/legal-framework.md (free public deliverable).
 */
export interface PublishedDeliverable {
  id: string;
  taskTitle: string;
  category: TaskCategory;
  org: Org;
  userNotes: string | null;
  publishedAt: number;
  /** Month the work was submitted/credited (committed_at is the stable anchor). */
  monthTs: number;
}

const SELECT = `
  SELECT
    s.id            AS id,
    s.user_notes    AS user_notes,
    s.published_at  AS published_at,
    s.committed_at  AS committed_at,
    t.title         AS task_title,
    t.category      AS category,
    t.org_id        AS org_id
  FROM submissions s
  JOIN task_templates t ON t.id = s.task_template_id
  WHERE s.published_at IS NOT NULL
`;

interface Row {
  id: string;
  user_notes: string | null;
  published_at: number;
  committed_at: number;
  task_title: string;
  category: TaskCategory;
  org_id: string;
}

function toDeliverable(row: Row, orgById: Map<string, Org>): PublishedDeliverable | null {
  const org = orgById.get(row.org_id);
  if (!org) return null;
  return {
    id: row.id,
    taskTitle: row.task_title,
    category: row.category,
    org,
    userNotes: row.user_notes,
    publishedAt: row.published_at,
    monthTs: row.committed_at,
  };
}

/** All published deliverables, newest first. Returns only non-PII fields. */
export async function listPublishedDeliverables(): Promise<PublishedDeliverable[]> {
  const rows =
    (await getDb()
      .prepare(`${SELECT} ORDER BY s.published_at DESC`)
      .all<Row>()).results ?? [];
  if (rows.length === 0) return [];
  const orgs = await listOrgs();
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  return rows.map((r) => toDeliverable(r, orgById)).filter(Boolean) as PublishedDeliverable[];
}

export interface PublishedDeliverableDetail extends PublishedDeliverable {
  files: SubmissionFile[];
}

/**
 * A single published deliverable + its public photos. Returns null if the
 * submission is not published (so callers can notFound()). Never returns PII.
 */
export async function getPublishedDeliverable(id: string): Promise<PublishedDeliverableDetail | null> {
  const row = await getDb().prepare(`${SELECT} AND s.id = ?`).bind(id).first<Row>();
  if (!row) return null;
  const orgs = await listOrgs();
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const base = toDeliverable(row, orgById);
  if (!base) return null;
  const allFiles = await getSubmissionFiles(id);
  const files = allFiles.filter((f) => f.kind === "photo");
  return { ...base, files };
}
