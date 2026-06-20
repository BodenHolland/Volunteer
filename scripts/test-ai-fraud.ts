import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { validateSubmission, AI_FALLBACK, verdictLabel, type AiVerdict } from "../lib/ai";
import {
  detectDuplicateImages,
  detectAiContent,
  detectGeotagMismatch,
  detectVelocityAnomaly,
  routeStatus,
  CITY_CENTROIDS,
} from "../lib/fraud";

function readDevVar(key: string): string | undefined {
  try {
    const txt = readFileSync(".dev.vars", "utf8");
    const m = txt.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

async function main() {
  console.log("== AI module ==");
  const key = readDevVar("OPENROUTER_API_KEY");
  if (!key) {
    const v = await validateSubmission({ rubric: "r", submissionText: "s", images: [] });
    check("no key → AI_FALLBACK", v === AI_FALLBACK && v.verdict === "flag" && v.confidence === 0);
  } else {
    console.log("  (OPENROUTER_API_KEY present — running a real call)");
    const v = await validateSubmission({
      rubric: "Submit a clear photo of a street tree with a species note.",
      submissionText: "I counted 8 trees on the 1200 block of Alabama St. Species: London plane, Ginkgo.",
      images: [],
      apiKey: key,
      model: readDevVar("OPENROUTER_MODEL"),
    });
    check("real verdict has a valid verdict", ["approve", "flag", "reject"].includes(v.verdict));
    console.log("  verdict:", JSON.stringify(v));
  }
  check("verdictLabel mapping", verdictLabel("approve") === "looks complete" && verdictLabel("reject") === "incomplete");

  console.log("== Fraud: duplicate image ==");
  const h1 = sha("photo-A");
  const h2 = sha("photo-B");
  const dupFlags = detectDuplicateImages(
    [{ fileId: "f1", hash: h1 }],
    [{ submissionId: "subPrev", fileId: "fp", hash: h1 }]
  );
  check("exact prior duplicate flagged", dupFlags.length === 1 && dupFlags[0].kind === "duplicate_image");
  const noDup = detectDuplicateImages([{ fileId: "f1", hash: h2 }], [{ submissionId: "s", fileId: "fp", hash: h1 }]);
  check("unique image not flagged", noDup.length === 0);
  const withinDup = detectDuplicateImages(
    [{ fileId: "a", hash: h1 }, { fileId: "b", hash: h1 }],
    []
  );
  check("duplicate within submission flagged", withinDup.length === 1);

  console.log("== Fraud: AI content ==");
  const aiVerdict: AiVerdict = { ...AI_FALLBACK, suspected_ai_content: true };
  check("suspected_ai_content → flag", detectAiContent(aiVerdict).length === 1);
  check(
    "reasoning mentions ai-generated → flag",
    detectAiContent({ ...AI_FALLBACK, reasoning: "This looks AI-generated." }).length === 1
  );
  check("clean verdict → no flag", detectAiContent(AI_FALLBACK).length === 0);

  console.log("== Fraud: geotag ==");
  const sf = CITY_CENTROIDS["San Francisco"];
  const near = detectGeotagMismatch("in_person", [{ lat: 37.7599, lng: -122.4148 }], sf); // Mission ~1mi
  check("nearby geotag ok", near.length === 0);
  const far = detectGeotagMismatch("in_person", [{ lat: 37.8044, lng: -122.2712 }], sf); // Oakland ~8mi
  check("far geotag → warn", far.length === 1 && far[0].severity === "warn");
  check("online task skips geotag", detectGeotagMismatch("online", [{ lat: 40, lng: -100 }], sf).length === 0);

  console.log("== Fraud: velocity ==");
  const now = 1_700_000_000_000;
  const fast = detectVelocityAnomaly(now, now - 5 * 60 * 1000, 3); // 5 min vs 3h est
  check("too-fast submission → warn", fast.length === 1 && fast[0].kind === "velocity_anomaly");
  const ok = detectVelocityAnomaly(now, now - 2 * 3600 * 1000, 3); // 2h vs 3h
  check("normal pace ok", ok.length === 0);

  console.log("== Routing ==");
  check("reject routes to rejected", routeStatus({ ...AI_FALLBACK, verdict: "reject" }, []) === "rejected");
  check("block flag routes to needs_changes", routeStatus(AI_FALLBACK, [{ kind: "duplicate_image", severity: "block" }]) === "needs_changes");
  check("approve+flags routes to pending_review", routeStatus({ ...AI_FALLBACK, verdict: "approve" }, far) === "pending_review");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
