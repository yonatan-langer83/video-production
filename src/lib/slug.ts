/** Production URL slugs: lowercase English letters, numbers, and hyphens only. */

export function slugifyProduction(
  input: string,
  opts?: { keepTrailingHyphen?: boolean },
): { slug: string; dropped: boolean } {
  const raw = String(input ?? '')
  const dropped = /[^a-zA-Z0-9\s_-]/.test(raw)

  let slug = raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')

  if (opts?.keepTrailingHyphen) {
    slug = slug.replace(/^-+/, '')
  } else {
    slug = slug.replace(/^-+|-+$/g, '')
  }

  return { slug, dropped }
}

export function isValidProductionSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}
