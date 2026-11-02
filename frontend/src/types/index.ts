export interface User {
  id: number
  username: string
  avatar: string
  bio: string
  role: 'user' | 'admin' | ''
}

export interface Pin {
  id: number
  title: string
  description?: string
  image_url: string
  thumb_url?: string | null
  category?: string
  tags?: string
  username: string
  user_avatar: string
  likes_count: number
  is_liked: boolean
  is_favorited?: boolean
}

export interface Board {
  id: number
  name: string
  description?: string
  pins_count?: number
  cover_url?: string | null
}
