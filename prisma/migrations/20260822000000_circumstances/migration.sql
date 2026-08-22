-- Store the circumstances of the matter alongside the verdict.
--
-- Nullable on purpose. Readings cast before the engine could read a planet's
-- accidental condition carry no circumstances, and a judgment already given to
-- a querent is not re-judged to fit a later engine: the figure was cast for a
-- moment that has passed.
ALTER TABLE "readings" ADD COLUMN "circumstances" JSONB;
