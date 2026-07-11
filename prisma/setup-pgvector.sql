-- Run once on Supabase: enable pgvector + pg_trgm and add the embedding column for semantic search.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS embedding vector(1536);
