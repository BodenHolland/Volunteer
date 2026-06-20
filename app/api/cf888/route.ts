import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import { getLedgerForUser, getOrg } from "@/lib/queries";
import { putFile } from "@/lib/r2";
import { newId } from "@/lib/ids";
import { buildCf888Pdf } from "@/lib/cf888";
import { decryptField } from "@/lib/crypto";
import { isCertEnabledForCity } from "@/lib/county";
import { writeAudit } from "@/lib/audit";
import { parseJson, type Address } from "@/lib/types";
import { currentMonth, monthLabel, formatDob } from "@/lib/time";

const ORG_PHONE: Record<string, string> = {
  "friends-of-the-urban-forest": "(415) 561-6890",
  "sf-civic-data-coalition": "(415) 555-0190",
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

  // Per-county pre-clearance gate (Change 8): no certification output in a county
  // until written CDSS/county confirmation is on record.
  if (!(await isCertEnabledForCity(user.city))) {
    return NextResponse.json(
      { error: "CalFresh certification isn't available in your county yet. We're working on it." },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month") || currentMonth();
  const ledger = await getLedgerForUser(user.id, month);
  const certified = ledger.reduce((a, r) => a + r.total_hours, 0);
  if (certified < 1) {
    return NextResponse.json(
      { error: "Available once at least one hour is certified." },
      { status: 400 }
    );
  }

  // Primary certifying org = the one with the most hours this month.
  const primary = [...ledger].sort((a, b) => b.total_hours - a.total_hours)[0];
  const org = primary.certified_org_id ? await getOrg(primary.certified_org_id) : null;
  const orgAddr = org ? parseJson<Address>(org.address_json, { line1: "", city: "", state: "", zip: "" }) : null;

  // Decrypt the recipient's PII (encrypted at rest; tolerant of seed plaintext).
  const legalName = (await decryptField(user.legal_name)) || user.full_name || "";
  const birthdate = formatDob(await decryptField(user.dob));
  const userAddr = parseJson<Address>(await decryptField(user.address_json), {
    line1: "",
    city: "San Francisco",
    state: "CA",
    zip: "",
  });

  const today = new Date();
  const dateSigned = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;

  const pdf = await buildCf888Pdf({
    participantName: legalName,
    birthdate,
    participantAddress: addrLines(userAddr),
    orgName: org?.name ?? "",
    representativeName: org?.signing_authority_name ?? "",
    orgAddress: orgAddr ? addrLines(orgAddr) : ["", "", ""],
    orgPhone: org ? ORG_PHONE[org.slug] ?? org.contact_email ?? "" : "",
    month: monthLabel(month),
    hours: primary.total_hours,
    activity: "ongoing",
    signatureName: org?.signing_authority_name ?? "",
    dateSigned,
  });

  // Persist a copy + ledger row of the generated form.
  const key = `cf888/${user.id}/${month}.pdf`;
  try {
    await putFile(key, pdf, "application/pdf");
    await getDb()
      .prepare("INSERT INTO cf888_forms (id, user_id, month, r2_key, generated_at) VALUES (?,?,?,?,?)")
      .bind(newId("cf888"), user.id, month, key, Date.now())
      .run();
  } catch {
    /* non-fatal for the demo download */
  }

  // CF 888 is a legal attestation document — audit every generation.
  await writeAudit({
    actorUserId: user.id,
    action: "cf888_generated",
    entityType: "cf888",
    entityId: `${user.id}:${month}`,
    detail: { month, certified_hours: certified, certifying_org_id: primary.certified_org_id },
  });

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="CF888-${month}.pdf"`,
    },
  });
}
