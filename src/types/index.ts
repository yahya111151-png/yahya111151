export type ConnectionType = 'colleague' | 'friend' | 'acquaintance' | 'stranger' | 'family'

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  cover_photo_url: string | null
  bio: string | null
  occupation: string | null
  location: string | null
  phone: string | null
  phone_public: boolean
  latitude: number | null
  longitude: number | null
  location_public: boolean
  aggregate_score: number
  total_ratings: number
  created_at: string
  updated_at: string
}

export interface RatingMetric {
  id: string
  name: string
  description: string
  icon: string
  sort_order: number
  active: boolean
}

export interface Connection {
  id: string
  user_id: string
  connected_user_id: string
  connection_type: ConnectionType
  interaction_count: number
  strength_score: number
  first_interaction_at: string
  last_interaction_at: string
}

export interface Rating {
  id: string
  rater_id: string | null
  rated_id: string
  proximity_weight: number
  closeness_score: number
  raw_avg_score: number
  weighted_score: number
  comment: string | null
  is_visible: boolean
  created_at: string
}

export interface RatingScore {
  id: string
  rating_id: string
  metric_id: string
  score: number
  weighted_score: number
}

export interface MetricAggregate {
  id: string
  user_id: string
  metric_id: string
  weighted_sum: number
  weight_total: number
  rating_count: number
  avg_score: number
}

export interface MetricScore {
  metric_id: string
  metric_name: string
  metric_icon: string
  avg_score: number
  rating_count: number
}

export interface ProfileWithMetrics extends Profile {
  metric_scores: MetricScore[] | null
}

export interface RatingSubmission {
  metric_id: string
  score: number
}

export interface ProximityParams {
  interactionCount: number
  connectionType: ConnectionType
  lastInteractionAt: Date
  mutualConnectionCount: number
}

export interface NearbyUser {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  occupation: string | null
  aggregate_score: number
  total_ratings: number
  distance_km: number
}
