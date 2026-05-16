import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scoreColor(score: number): string {
  if (score >= 4.0) return 'text-score-high'
  if (score >= 2.5) return 'text-score-mid'
  return 'text-score-low'
}

export function scoreRingColor(score: number): string {
  if (score >= 4.0) return '#34d399'
  if (score >= 2.5) return '#fbbf24'
  return '#f87171'
}

export function formatScore(score: number): string {
  return score.toFixed(2)
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60)    return 'just now'
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

export function coverGradient(username: string): string {
  const hash = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const h1 = hash % 360
  const h2 = (hash * 13 + 120) % 360
  return `linear-gradient(135deg, hsl(${h1},60%,15%) 0%, hsl(${h2},55%,22%) 100%)`
}

export function distanceLabel(km: number): string {
  if (km < 1)   return `${Math.round(km * 1000)}m away`
  if (km < 10)  return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}

export function memberSince(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
