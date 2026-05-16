-- ============================================================
-- NOSEDIVE — Initial Schema
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  occupation    TEXT,
  location      TEXT,
  aggregate_score   NUMERIC(4,2) DEFAULT 0,  -- weighted avg across all metrics
  total_ratings     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. RATING METRICS (configurable categories)
CREATE TABLE IF NOT EXISTS public.rating_metrics (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true
);

ALTER TABLE public.rating_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metrics are publicly readable" ON public.rating_metrics FOR SELECT USING (true);

INSERT INTO public.rating_metrics (name, description, icon, sort_order) VALUES
  ('Kindness',        'How kind, empathetic, and caring this person is',          '💛', 1),
  ('Leadership',      'Ability to lead, inspire, and guide others effectively',   '🎯', 2),
  ('Friendship',      'Quality as a friend — loyalty, presence, and warmth',      '🤝', 3),
  ('Reliability',     'How dependable, punctual, and trustworthy',                '🔒', 4),
  ('Creativity',      'Original thinking, problem-solving, and innovation',       '✨', 5),
  ('Professionalism', 'Work ethic, respect, and conduct in professional settings','💼', 6);


-- 3. CONNECTIONS (tracks the social graph + proximity)
CREATE TABLE IF NOT EXISTS public.connections (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connected_user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connection_type     TEXT CHECK (connection_type IN ('colleague','friend','acquaintance','stranger')) DEFAULT 'stranger',
  interaction_count   INTEGER DEFAULT 1,
  strength_score      NUMERIC(5,4) DEFAULT 0.1000, -- 0.0 → 1.0, computed by algorithm
  first_interaction_at  TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, connected_user_id),
  CHECK (user_id <> connected_user_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own connections"
  ON public.connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can manage own connections"
  ON public.connections FOR ALL USING (auth.uid() = user_id);


-- 4. INTERACTION LOGS (raw events that feed the proximity algorithm)
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_user_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('rated','viewed_profile','connected','mentioned')) NOT NULL,
  event_weight    NUMERIC(3,2) DEFAULT 1.00, -- different events carry different weights
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own interaction logs"
  ON public.interaction_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own interaction logs"
  ON public.interaction_logs FOR SELECT USING (auth.uid() = user_id);


-- 5. RATINGS (one per rater-ratee pair per submission)
CREATE TABLE IF NOT EXISTS public.ratings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rated_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  proximity_weight    NUMERIC(5,4) NOT NULL,  -- snapshot of weight at rating time
  closeness_score     NUMERIC(5,4) NOT NULL,  -- raw proximity score (0.0-1.0)
  raw_avg_score       NUMERIC(4,2) NOT NULL,  -- simple avg of metric scores (1-5)
  weighted_score      NUMERIC(6,4) NOT NULL,  -- raw_avg * proximity_weight
  comment             TEXT,
  is_visible          BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ratings on public profiles"
  ON public.ratings FOR SELECT USING (is_visible = true);
CREATE POLICY "Authenticated users can insert ratings"
  ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);


-- 6. RATING SCORES (per-metric breakdown inside a rating)
CREATE TABLE IF NOT EXISTS public.rating_scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id   UUID REFERENCES public.ratings(id) ON DELETE CASCADE NOT NULL,
  metric_id   UUID REFERENCES public.rating_metrics(id) NOT NULL,
  score       INTEGER CHECK (score >= 1 AND score <= 5) NOT NULL,
  weighted_score NUMERIC(6,4),
  UNIQUE (rating_id, metric_id)
);

ALTER TABLE public.rating_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rating scores"
  ON public.rating_scores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rating scores"
  ON public.rating_scores FOR INSERT WITH CHECK (
    auth.uid() = (SELECT rater_id FROM public.ratings WHERE id = rating_id)
  );


-- 7. METRIC AGGREGATES (running totals per user per metric, updated by trigger)
CREATE TABLE IF NOT EXISTS public.metric_aggregates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_id       UUID REFERENCES public.rating_metrics(id) NOT NULL,
  weighted_sum    NUMERIC(12,4) DEFAULT 0,
  weight_total    NUMERIC(12,4) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  avg_score       NUMERIC(4,2) DEFAULT 0,  -- weighted avg for this metric
  UNIQUE (user_id, metric_id)
);

ALTER TABLE public.metric_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metric aggregates are publicly readable"
  ON public.metric_aggregates FOR SELECT USING (true);


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Update metric aggregates and profile score after a rating is submitted
CREATE OR REPLACE FUNCTION public.handle_new_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_metric RECORD;
  v_score  INTEGER;
  v_weighted NUMERIC;
BEGIN
  -- Update metric_aggregates for each score in this rating
  FOR v_metric IN
    SELECT rs.metric_id, rs.score, rs.weighted_score
    FROM public.rating_scores rs
    WHERE rs.rating_id = NEW.id
  LOOP
    v_score   := v_metric.score;
    v_weighted := v_metric.weighted_score;

    INSERT INTO public.metric_aggregates (user_id, metric_id, weighted_sum, weight_total, rating_count, avg_score)
    VALUES (
      NEW.rated_id,
      v_metric.metric_id,
      v_weighted,
      NEW.proximity_weight,
      1,
      v_score
    )
    ON CONFLICT (user_id, metric_id) DO UPDATE SET
      weighted_sum  = metric_aggregates.weighted_sum  + v_weighted,
      weight_total  = metric_aggregates.weight_total  + NEW.proximity_weight,
      rating_count  = metric_aggregates.rating_count  + 1,
      avg_score     = CASE
        WHEN (metric_aggregates.weight_total + NEW.proximity_weight) > 0
        THEN (metric_aggregates.weighted_sum + v_weighted) / (metric_aggregates.weight_total + NEW.proximity_weight)
        ELSE 0
      END;
  END LOOP;

  -- Recalculate overall aggregate_score for the rated user
  UPDATE public.profiles
  SET
    aggregate_score = (
      SELECT CASE WHEN SUM(weight_total) > 0
             THEN ROUND((SUM(weighted_sum) / SUM(weight_total))::NUMERIC, 2)
             ELSE 0 END
      FROM public.metric_aggregates
      WHERE user_id = NEW.rated_id
    ),
    total_ratings = total_ratings + 1,
    updated_at = NOW()
  WHERE id = NEW.rated_id;

  -- Log the interaction for the proximity algorithm
  INSERT INTO public.interaction_logs (user_id, target_user_id, interaction_type, event_weight)
  VALUES (NEW.rater_id, NEW.rated_id, 'rated', 3.00);

  -- Upsert connection strength
  INSERT INTO public.connections (user_id, connected_user_id, interaction_count, last_interaction_at)
  VALUES (NEW.rater_id, NEW.rated_id, 1, NOW())
  ON CONFLICT (user_id, connected_user_id) DO UPDATE SET
    interaction_count   = connections.interaction_count + 1,
    last_interaction_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_rating_created ON public.ratings;
CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_rating();


-- Function to get mutual connection count between two users
CREATE OR REPLACE FUNCTION public.get_mutual_connection_count(user_a UUID, user_b UUID)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.connections a
  JOIN public.connections b
    ON a.connected_user_id = b.connected_user_id
  WHERE a.user_id = user_a AND b.user_id = user_b;
$$;


-- View: profiles with their metric breakdowns
CREATE OR REPLACE VIEW public.profile_with_metrics AS
SELECT
  p.*,
  json_agg(
    json_build_object(
      'metric_id',    ma.metric_id,
      'metric_name',  rm.name,
      'metric_icon',  rm.icon,
      'avg_score',    ma.avg_score,
      'rating_count', ma.rating_count
    ) ORDER BY rm.sort_order
  ) FILTER (WHERE ma.id IS NOT NULL) AS metric_scores
FROM public.profiles p
LEFT JOIN public.metric_aggregates ma ON ma.user_id = p.id
LEFT JOIN public.rating_metrics rm ON rm.id = ma.metric_id
GROUP BY p.id;
