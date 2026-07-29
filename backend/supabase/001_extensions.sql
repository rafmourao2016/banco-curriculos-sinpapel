-- Execute primeiro no SQL Editor do Supabase.
-- Necessario para IDs UUID e busca semantica com pgvector.
create extension if not exists "pgcrypto";
create extension if not exists "vector";
