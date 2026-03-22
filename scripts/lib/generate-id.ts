import { createHash } from "node:crypto";

function generateId(prefix: string, title: string, salt?: string | number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yymmdd = `${yy}${mm}${dd}`;

  const hashInput = salt !== undefined ? `${title}:${salt}` : title;
  const hash = createHash("sha256").update(hashInput).digest("hex");
  const suffix = hash.slice(-4).toUpperCase();

  return `${prefix}-${yymmdd}-${suffix}`;
}

export function generateInsightId(title: string, salt?: string | number): string {
  return generateId("INS", title, salt);
}

export function generateSourceId(title: string, salt?: string | number): string {
  return generateId("SRC", title, salt);
}

export function generatePrincipleId(title: string, salt?: string | number): string {
  return generateId("PRI", title, salt);
}

export function generateMentalModelId(title: string, salt?: string | number): string {
  return generateId("MM", title, salt);
}

export function generateTensionId(title: string, salt?: string | number): string {
  return generateId("T", title, salt);
}

export function generateDecisionId(title: string, salt?: string | number): string {
  return generateId("DEC", title, salt);
}

export function generatePredictionId(title: string, salt?: string | number): string {
  return generateId("PRED", title, salt);
}
