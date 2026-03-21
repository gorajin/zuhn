const MAX_SLUG_LENGTH = 80;

export function slugify(title: string): string {
  let slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")   // strip non-ASCII
    .replace(/[^a-z0-9\s-]/g, "")   // keep only alphanumeric, spaces, hyphens
    .replace(/[\s-]+/g, "-")         // spaces/hyphens → single hyphen
    .replace(/^-+|-+$/g, "");        // trim leading/trailing hyphens

  if (slug.length === 0) return "untitled";
  if (slug.length > MAX_SLUG_LENGTH) slug = slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");

  return slug;
}
