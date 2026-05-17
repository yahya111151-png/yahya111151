'use client'

import { useState } from 'react'
import Image from 'next/image'
import { avatarUrl } from '@/lib/utils'

interface AvatarProps {
  src: string | null | undefined
  username: string
  size?: number
  className?: string
}

export default function Avatar({ src, username, size = 48, className = '' }: AvatarProps) {
  const fallback = avatarUrl(username || 'user')
  const [imgSrc, setImgSrc] = useState(src || fallback)

  return (
    <Image
      src={imgSrc}
      alt={username}
      width={size}
      height={size}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  )
}
