import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const originalUrl =
  "https://www.markupdesigns.net/indiekonnect-distributor/_next/static/media/logo.271hs3nwqupt5.png";
const [component = "CreditNotes_EmbeddedLogo.tsx", localPng] =
  process.argv.slice(2);
try {
  const target = resolve(component);
  const source = await readFile(target, "utf8");
  const marker =
    /const EMBEDDED_CREDIT_NOTE_LOGO = "[A-Za-z0-9+/=]*"; \/\/ EMBED_CREDIT_LOGO_MARKER/;
  if (!marker.test(source))
    throw new Error(
      "Use the updated CreditNotes_EmbeddedLogo.tsx file; logo marker not found.",
    );
  let bytes;
  if (localPng) {
    bytes = await readFile(resolve(localPng));
  } else {
    const response = await fetch(originalUrl, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      throw new Error(`Logo server returned HTTP ${response.status}.`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (
    bytes.length < 33 ||
    !bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error(
      "Not a valid PNG. Save the actual original PNG, not an HTML page.",
    );
  }
  const w = bytes.readUInt32BE(16),
    h = bytes.readUInt32BE(20);
  if (!w || !h) throw new Error("Invalid PNG dimensions.");
  const updated = source.replace(
    marker,
    `const EMBEDDED_CREDIT_NOTE_LOGO = "${bytes.toString("base64")}"; // EMBED_CREDIT_LOGO_MARKER`,
  );
  await writeFile(target, updated, "utf8");
  console.log(
    `Logo embedded successfully: ${w} x ${h}, ${bytes.length} bytes.\n${target}\nReplace your existing component and rebuild. No runtime logo request is needed.`,
  );
} catch (error) {
  console.error(
    `Logo embedding failed: ${error.message}\nSave the original PNG locally and run: node embed-credit-logo.mjs "${component}" indiekonnect-brand-logo.png`,
  );
  process.exitCode = 1;
}
