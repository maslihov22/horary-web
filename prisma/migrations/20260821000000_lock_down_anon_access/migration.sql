-- Take the table out of reach of Supabase's public roles.
--
-- Supabase grants `anon` and `authenticated` full privileges on everything in
-- `public` by default, on the assumption that row level security is what
-- actually guards the rows. Prisma creates its tables as `postgres` and knows
-- nothing about that convention, so the table arrived with the grants in place
-- and no policies behind them: the anon key shipped to every browser could
-- read, alter, or truncate all of `readings` through the REST API. That would
-- have exposed the questions people asked, where they asked from, and the ids
-- and access tokens the whole ownership scheme treats as secrets.
--
-- Nothing here speaks to the database as `anon`. The app connects as the
-- table's owner through Prisma, so the fix is to withdraw the access rather
-- than to write policies around it. Enabling row level security then denies
-- by default: with no policy defined, any role that is not the owner gets
-- nothing, including roles a future Supabase default might grant again.
REVOKE ALL ON TABLE "readings" FROM anon, authenticated;

ALTER TABLE "readings" ENABLE ROW LEVEL SECURITY;
