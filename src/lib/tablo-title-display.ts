/** Prevent a line break before an em dash (bind dash to preceding word). */
export function tabloTitleWithBoundEmDash(title: string): string {
  return title.replace(/\s+—\s+/g, "\u00a0— ");
}
