type ProductionRef = { slug?: string | null } | number | string | null | undefined

export function getProductionSlug(production: ProductionRef): string | null {
  if (!production) return null
  if (typeof production === 'object' && production !== null && 'slug' in production) {
    const slug = production.slug
    return slug && String(slug).trim() ? String(slug) : null
  }
  return null
}

export function getEpisodeUrl(
  production: ProductionRef,
  episodeId: number | string,
): string | null {
  const slug = getProductionSlug(production)
  if (!slug) return null
  return `/productions/${slug}/episodes/${episodeId}`
}
