import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { username: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('profile_with_metrics')
    .select('full_name,username,aggregate_score,total_ratings,bio,avatar_url')
    .eq('username', params.username)
    .single()

  if (!p) {
    return {
      title: 'Profile · Lens',
      description: 'Social reputation, quantified.',
    }
  }

  const score = `${p.aggregate_score >= 0 ? '+' : ''}${Number(p.aggregate_score).toFixed(2)}`
  const title = `${p.full_name} (@${p.username}) · Lens`
  const description = p.bio
    ? `${p.bio} — Impression ${score}, seen by ${p.total_ratings} people on Lens.`
    : `${p.full_name} has an impression of ${score} from ${p.total_ratings} people on Lens. See through people, See More.`

  const url = `https://lens.yahya111151.vercel.app/profile/${p.username}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Lens',
      type: 'profile',
      images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  }
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>
}
