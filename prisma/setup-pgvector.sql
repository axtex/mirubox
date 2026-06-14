-- Run once on Supabase: enable pgvector and add the embedding column for semantic search.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS embedding vector(1536);
