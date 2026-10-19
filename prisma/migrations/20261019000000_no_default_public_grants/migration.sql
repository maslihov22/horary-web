-- Stop new tables from arriving open to Supabase's public roles.
--
-- lock_down_anon_access closed `readings`, but only that table: Supabase's
-- default privileges still grant `anon` and `authenticated` everything on any
-- object `postgres` creates in `public`. Prisma migrates as `postgres`, so every
-- future table would ship reachable through the REST API with the anon key and
-- no row level security behind it. Withdrawing the defaults fixes it at the
-- source; the app never speaks as those roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Prisma's own bookkeeping table sits in `public` too, and was flagged with row
-- level security off. Enabled by hand on the live database; recorded here so a
-- fresh one starts the same way. Prisma connects as its owner, which RLS does
-- not restrict.
REVOKE ALL ON TABLE "_prisma_migrations" FROM anon, authenticated;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
