import { redirect } from 'next/navigation'

export default async function LegacyProjectEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/productions/mekubalim/episodes/${id}/edit`)
}
