import { writeFile } from "node:fs/promises";
import { buildCf888Pdf } from "../lib/cf888";

async function main() {
  const pdf = await buildCf888Pdf({
    participantName: "Marisol Reyes Castellanos",
    birthdate: "March 14, 1991",
    participantAddress: ["1242 Alabama Street, Apt 3", "San Francisco, CA 94110", ""],
    orgName: "Friends of the Urban Forest",
    representativeName: "Daniel Okafor",
    orgAddress: ["1007 General Kennedy Ave #1", "San Francisco, CA 94129", ""],
    orgPhone: "(415) 561-6890",
    month: "June 2026",
    hours: 12,
    activity: "ongoing",
    signatureName: "Daniel Okafor",
    dateSigned: "06/19/2026",
  });

  await writeFile("/tmp/cf888-demo.pdf", pdf);
  console.log("wrote /tmp/cf888-demo.pdf", pdf.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
