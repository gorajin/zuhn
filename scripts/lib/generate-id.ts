import { createHash } from "node:crypto";

function generateId(prefix: string, title: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yymmdd = `${yy}${mm}${dd}`;

  const hash = createHash("sha256").update(title).digest("hex");
  const suffix = hash.slice(-4).toUpperCase();

  return `${prefix}-${yymmdd}-${suffix}`;
}

export function generateInsightId(title: string): string {
  return generateId("INS", title);
}

export function generateSourceId(title: string): string {
  return generateId("SRC", title);
}

export function generatePrincipleId(title: string): string {
  return generateId("PRI", title);
}

export function generateMentalModelId(title: string): string {
  return generateId("MM", title);
}

export function generateTensionId(title: string): string {
  return generateId("T", title);
}
