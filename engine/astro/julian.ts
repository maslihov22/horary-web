import { julian } from 'astronomia'

// Build a Gregorian calendar date with fractional day from a UTC Date,
// then convert to Julian Day. We treat UTC≈TT for horary (sub-second ΔT is
// far below our 1° tolerance).
// astronomia 4.2: CalendarGregorian exposes toJD() (not toJDE()).
export function toJDE(utc: Date): number {
  const y = utc.getUTCFullYear()
  const m = utc.getUTCMonth() + 1
  const dayFrac =
    utc.getUTCDate() +
    utc.getUTCHours() / 24 +
    utc.getUTCMinutes() / 1440 +
    utc.getUTCSeconds() / 86400
  const cal = new julian.CalendarGregorian(y, m, dayFrac)
  return cal.toJD()
}
