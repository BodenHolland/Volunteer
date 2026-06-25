/**
 * GET /api/work-cert?month=YYYY-MM
 *
 * State-agnostic work-hours certification PDF endpoint. Routes on the
 * recipient's state — CA → CF 888, other named-form states → their own
 * generator, fallback states → generic colift verification letter. Gated
 * on state-level pre-clearance (DEMO_MODE / cleared county / shipped
 * named-form state). Replaces the legacy CA-specific /api/cf888 path,
 * which now thin-redirects here.
 */
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import { getLedgerForUser, getOrg } from "@/lib/queries";
import { putFile } from "@/lib/r2";
import { newId } from "@/lib/ids";
import { buildStateForm } from "@/lib/forms";
import { decryptField } from "@/lib/crypto";
import { isCertEnabledForState } from "@/lib/county";
import { writeAudit } from "@/lib/audit";
import { parseJson, type Address } from "@/lib/types";
import { currentMonth, monthLabel, formatDob } from "@/lib/time";

const ORG_PHONE: Record<string, string> = {
  "canopy-commons": "(916) 561-6890",
  "civic-data-collective": "(916) 555-0190",
};

function addrLines(a: Address): string[] {
  const l0 = [a.line1, a.line2].filter(Boolean).join(", ");
  const l1 = `${a.city}, ${a.state} ${a.zip}`.trim();
  return [l0, l1, ""];
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "recipient") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Derive state up-front so the gate and the dispatcher agree.
  const userAddr = parseJson<Address>(await decryptField(user.address_json), {
    line1: "",
    city: user.city ?? "",
    state: user.state ?? "CA",
    zip: "",
  });
  const userState = (userAddr.state || user.state || "CA").toUpperCase();

  if (!(await isCertEnabledForState(userState))) {
    return NextResponse.json(
      {
        error:
          "Work-hours certification isn't available in your state yet. We're working on it.",
        state: userState,
      },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month") || currentMonth();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "month must use YYYY-MM." }, { status: 400 });
  }
  const ledger = await getLedgerForUser(user.id, month);
  const certified = ledger.reduce((a, r) => a + r.total_hours, 0);
  if (certified < 1) {
    return NextResponse.json(
      { error: "Available once at least one hour is certified." },
      { status: 400 }
    );
  }

  const legalName = (await decryptField(user.legal_name)) || user.full_name || "";
  const birthdate = formatDob(await decryptField(user.dob));

  const caseNumber = (await decryptField(user.case_number)) || undefined;

  const merged = await PDFDocument.create();
  let spec: Awaited<ReturnType<typeof buildStateForm>>["spec"] | null = null;
  for (const entry of ledger) {
    const org = entry.certified_org_id ? await getOrg(entry.certified_org_id) : null;
    const orgAddr = org ? parseJson<Address>(org.address_json, { line1: "", city: "", state: "", zip: "" }) : null;
    const built = await buildStateForm(userState, { participantName: legalName, birthdate, participantAddress: addrLines(userAddr), participantPhone: user.phone || undefined, caseNumber, orgName: org?.name ?? "", representativeName: org?.signing_authority_name ?? "", representativeTitle: org?.signing_authority_title ?? undefined, orgAddress: orgAddr ? addrLines(orgAddr) : ["", "", ""], orgPhone: org ? ORG_PHONE[org.slug] ?? org.contact_email ?? "" : "", orgEmail: org?.contact_email ?? undefined, month: monthLabel(month), monthIso: month, hours: entry.total_hours, activity: "ongoing", signatureName: "", dateSigned: "" });
    spec ??= built.spec;
    const source = await PDFDocument.load(built.pdf);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  const pdf = await merged.save();
  if (!spec) return NextResponse.json({ error: "No certificate data found." }, { status: 400 });

  // Persist a copy + ledger row of the generated form (R2 path stays under
  // cf888/ so existing audit records and downstream tooling don't churn).
  const key = `cf888/${user.id}/${month}.pdf`;
  try {
    await putFile(key, pdf, "application/pdf");
    await getDb()
      .prepare("INSERT INTO cf888_forms (id, user_id, month, r2_key, generated_at) VALUES (?,?,?,?,?)")
      .bind(newId("cf888"), user.id, month, key, Date.now())
      .run();
  } catch {
    /* non-fatal for the download */
  }

  await writeAudit({
    actorUserId: user.id,
    action: "work_cert_generated",
    entityType: "work_cert",
    entityId: `${user.id}:${month}`,
    detail: {
      month,
      certified_hours: certified,
      certifying_organizations: ledger.map((entry) => entry.certified_org_id),
      state: userState,
      form_id: spec.formId,
    },
  });

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="work-hours-certification-${userState}-${month}.pdf"`,
      "X-colift-Form-Id": spec.formId,
      "X-colift-Submission-Target": spec.submissionTarget,
    },
  });
}
