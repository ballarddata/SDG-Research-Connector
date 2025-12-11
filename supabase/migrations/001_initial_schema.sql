-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create institutions table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  type TEXT CHECK (type IN ('university', 'research_center', 'government', 'industry')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  profile_url TEXT,
  h_index INTEGER,
  citation_count INTEGER,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  abstract TEXT,
  publication_date DATE,
  doi TEXT UNIQUE,
  source_url TEXT,
  pdf_url TEXT,
  embedding VECTOR(384),
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sdgs (
  id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 17),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT -- hex color for UI badges
);

CREATE TABLE author_papers (
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  author_order INTEGER NOT NULL,
  is_corresponding BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (author_id, paper_id)
);

CREATE TABLE paper_sdgs (
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  sdg_id INTEGER REFERENCES sdgs(id) ON DELETE RESTRICT,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  classification_method TEXT DEFAULT 'osdg',
  classified_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (paper_id, sdg_id)
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  target_author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  similarity_score DECIMAL(4,3) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  shared_sdgs INTEGER[] NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  CONSTRAINT no_self_recommend CHECK (source_author_id != target_author_id),
  UNIQUE (source_author_id, target_author_id, generated_at)
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  byu_net_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT,
  sdg_filters INTEGER[],
  results_count INTEGER,
  clicked_paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recommendation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  action_taken TEXT CHECK (action_taken IN ('email_sent', 'profile_viewed', 'dismissed'))
);

-- Create indexes for performance
CREATE INDEX papers_embedding_idx ON papers USING hnsw (embedding vector_cosine_ops);
CREATE INDEX authors_embedding_idx ON authors USING hnsw (embedding vector_cosine_ops);
CREATE INDEX papers_doi_idx ON papers(doi) WHERE doi IS NOT NULL;
CREATE INDEX authors_institution_idx ON authors(institution_id);
CREATE INDEX author_papers_paper_idx ON author_papers(paper_id);
CREATE INDEX author_papers_order_idx ON author_papers(author_order);
CREATE INDEX paper_sdgs_sdg_score_idx ON paper_sdgs(sdg_id, confidence_score DESC);
CREATE INDEX paper_sdgs_confidence_idx ON paper_sdgs(confidence_score) WHERE confidence_score >= 0.7;
CREATE INDEX recommendations_source_score_idx ON recommendations(source_author_id, similarity_score DESC);
CREATE INDEX recommendations_target_idx ON recommendations(target_author_id);
CREATE INDEX recommendations_expires_idx ON recommendations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX search_logs_user_time_idx ON search_logs(user_id, searched_at DESC);
CREATE INDEX search_logs_time_idx ON search_logs(searched_at DESC);
CREATE INDEX recommendation_views_rec_idx ON recommendation_views(recommendation_id);
CREATE INDEX recommendation_views_user_idx ON recommendation_views(user_id, viewed_at DESC);

-- Enable Row Level Security
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_sdgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view SDGs (reference data)
CREATE POLICY "Anyone can view SDGs" ON sdgs
  FOR SELECT USING (true);

-- Anyone can view institutions
CREATE POLICY "Anyone can view institutions" ON institutions
  FOR SELECT USING (true);

-- Authenticated users can view papers
CREATE POLICY "Authenticated users can view papers" ON papers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can view authors
CREATE POLICY "Authenticated users can view authors" ON authors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can view author_papers
CREATE POLICY "Authenticated users can view author_papers" ON author_papers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can view paper_sdgs
CREATE POLICY "Authenticated users can view paper_sdgs" ON paper_sdgs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can view recommendations
CREATE POLICY "Authenticated users can view recommendations" ON recommendations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can view their own user record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own user record
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own user record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can insert search logs
CREATE POLICY "Authenticated users can log searches" ON search_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own search logs
CREATE POLICY "Users can view own search logs" ON search_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert recommendation views
CREATE POLICY "Authenticated users can log views" ON recommendation_views
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own recommendation views
CREATE POLICY "Users can view own rec views" ON recommendation_views
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: search_papers
CREATE OR REPLACE FUNCTION search_papers(
  query_embedding VECTOR(384),
  sdg_filter INTEGER[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  paper_id UUID,
  title TEXT,
  abstract TEXT,
  authors TEXT[],
  similarity_score DECIMAL,
  sdg_ids INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.abstract,
    ARRAY_AGG(DISTINCT a.name ORDER BY ap.author_order) as authors,
    (1 - (p.embedding <=> query_embedding))::DECIMAL(4,3) as similarity_score,
    ARRAY_AGG(DISTINCT ps.sdg_id ORDER BY ps.sdg_id) as sdg_ids
  FROM papers p
  LEFT JOIN author_papers ap ON p.id = ap.paper_id
  LEFT JOIN authors a ON ap.author_id = a.id
  LEFT JOIN paper_sdgs ps ON p.id = ps.paper_id
  WHERE (sdg_filter IS NULL OR ps.sdg_id = ANY(sdg_filter))
    AND ps.confidence_score >= 0.7
  GROUP BY p.id, p.title, p.abstract, p.embedding
  ORDER BY p.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_papers TO authenticated;

-- RPC Function: get_recommendations_for_user
CREATE OR REPLACE FUNCTION get_recommendations_for_user(
  user_email_param TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  recommendation_id UUID,
  author_id UUID,
  author_name TEXT,
  author_email TEXT,
  institution_name TEXT,
  similarity_score DECIMAL,
  shared_sdgs INTEGER[],
  paper_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    a.id,
    a.name,
    a.email,
    i.name,
    r.similarity_score,
    r.shared_sdgs,
    COUNT(DISTINCT ap.paper_id) as paper_count
  FROM recommendations r
  JOIN authors a ON r.target_author_id = a.id
  LEFT JOIN institutions i ON a.institution_id = i.id
  JOIN author_papers ap ON a.id = ap.author_id
  JOIN paper_sdgs ps ON ap.paper_id = ps.paper_id
  WHERE r.source_author_id = (
    SELECT id FROM authors WHERE email = user_email_param LIMIT 1
  )
  AND ps.sdg_id = ANY(r.shared_sdgs)
  AND ps.confidence_score >= 0.7
  GROUP BY r.id, a.id, a.name, a.email, i.name, r.similarity_score, r.shared_sdgs
  ORDER BY r.similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_recommendations_for_user TO authenticated;