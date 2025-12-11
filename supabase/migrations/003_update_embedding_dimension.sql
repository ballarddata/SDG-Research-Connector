ALTER TABLE authors
  ALTER COLUMN embedding TYPE vector(1536);

ALTER TABLE papers
  ALTER COLUMN embedding TYPE vector(1536);

CREATE OR REPLACE FUNCTION search_papers(
  query_embedding VECTOR(1536),
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
    ARRAY_AGG(a.name ORDER BY ap.author_order) AS authors,
    (1 - (p.embedding <=> query_embedding))::DECIMAL(4,3) AS similarity_score,
    ARRAY_AGG(DISTINCT ps.sdg_id ORDER BY ps.sdg_id) FILTER (WHERE ps.sdg_id IS NOT NULL) AS sdg_ids
  FROM papers p
  LEFT JOIN author_papers ap ON p.id = ap.paper_id
  LEFT JOIN authors a ON ap.author_id = a.id
  LEFT JOIN paper_sdgs ps ON p.id = ps.paper_id
  WHERE (sdg_filter IS NULL OR ps.sdg_id = ANY(sdg_filter))
    AND (ps.sdg_id IS NULL OR ps.confidence_score >= 0.7)
  GROUP BY p.id, p.title, p.abstract, p.embedding
  ORDER BY p.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_papers TO authenticated;
