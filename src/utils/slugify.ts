/** Generate a URL-safe slug from title and author. */
export function generateSlug(title: string, author: string): string {
  const raw = `${title} ${author}`
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
