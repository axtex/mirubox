export function cleanDescription(html: string | null | undefined, maxLength = 160): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<i>(.*?)<\/i>/gi, "$1")
    .replace(/<b>(.*?)<\/b>/gi, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
