import type { Chart, Verdict, PlanetName, PlanetPos } from '../types'
import { rulerOfHouse, essentialDignity, signOf } from './rulerships'
import { findAspect } from './aspects'
import { reception } from './receptions'
import { isMoonVoid } from './voidofcourse'
import { estimateTiming } from './timing'
import { findTranslation } from './translation'
import { findProhibition, isRefranated, moonMotion, nature } from './testimonies'

const ALL_PLANETS: PlanetName[] =
  ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']

// ─── Canonical horary judgment (Lilly), by testimony — NOT by score ─────────
//
// The matter is judged in the order a traditional astrologer reads it:
//   1. Do the significators perfect the matter? (direct aspect, translation,
//      or collection of light)
//   2. Is that perfection destroyed? (prohibition, refranation, separation)
//   3. What does the Moon, as co-significator and witness, testify?
//   4. Reception and dignity qualify HOW the matter comes about, they do not
//      by themselves make a "yes".
//
// The verdict is a qualitative reading of those facts, not a sum of points.
export function judge(chart: Chart, quesitedHouse: number): Verdict {
  const reasons: string[] = []
  const houseRuler: PlanetName = rulerOfHouse(1, chart.cusps)
  const quesited: PlanetName = rulerOfHouse(quesitedHouse, chart.cusps)

  // One planet can rule both houses — Sagittarius rising with Pisces on the
  // 10th gives Jupiter twice, which is common on career questions. Judging a
  // planet against itself yields nonsense (a 0° "separating conjunction" of
  // Jupiter with Jupiter, light translated from Jupiter to Jupiter), so the
  // significators must be separated before anything is measured.
  //
  // Lilly states no rule for this case. He does already carry the Moon as
  // co-significator of the querent, so she takes the querent's part and the
  // shared planet is left to the matter alone. (Bonatti instead weighs the
  // dispositors of the shared planet; that is a different school and is
  // deliberately not mixed in here.)
  let querent = houseRuler
  if (houseRuler === quesited) {
    reasons.push(`Same ruler (${houseRuler}) governs both the querent and the matter — they are closely bound together.`)
    if (houseRuler === 'Moon') {
      // Nothing is left to stand apart from the matter; Lilly's own co-
      // significator is already spoken for.
      reasons.push(`The Moon rules both, and so does not separate from the matter — the chart yields no distinct significators to judge by.`)
      return {
        verdict: 'qualified',
        confidence: 0.3,
        reasons,
        timing: null,
      }
    }
    querent = 'Moon'
    reasons.push(`The Moon, co-significator of the querent, is taken for the querent, and ${quesited} for the matter alone.`)
  }

  const qP = chart.planets[querent]
  const tP = chart.planets[quesited]

  // ── 1. PERFECTION ─────────────────────────────────────────────────────────
  let perfection: 'direct' | 'translation' | 'collection' | null = null
  let perfectingSign = signOf(tP.lon)
  let degreesToEvent = 3
  let translator: PlanetName | null = null

  const direct = findAspect(qP, tP)
  if (direct && direct.applying) {
    perfection = 'direct'
    perfectingSign = signOf(tP.lon)
    degreesToEvent = direct.degreesToPerfect
    reasons.push(`${querent} applies to ${quesited} by ${direct.type} (${direct.degreesToPerfect.toFixed(1)}° to perfection) — the parties come together directly.`)
  } else if (direct && !direct.applying) {
    reasons.push(`${querent} and ${quesited} are separating (${direct.type}) — that direct route is past, not forming.`)
  } else {
    reasons.push(`No direct aspect between ${querent} and ${quesited}.`)
  }

  let strongBeneficTranslator = false
  if (!perfection) {
    const others: PlanetPos[] = ALL_PLANETS.map(n => chart.planets[n])
    const tr = findTranslation(qP, tP, others)
    if (tr) {
      perfection = 'translation'
      translator = tr.translator
      const trP = chart.planets[tr.translator]
      perfectingSign = signOf(trP.lon)
      reasons.push(`${tr.detail} The matter is carried between the parties by a third.`)
      // Lilly: a fortunate planet, strong by essential dignity, "is able by his
      // strength to qualify and take off the malice" — it carries the matter
      // through despite weak side-testimony.
      if (nature(tr.translator) === 'benefic' && essentialDignity(tr.translator, trP.lon) > 0) {
        strongBeneficTranslator = true
        reasons.push(`${tr.translator} is a fortune strong by essential dignity — it has the power to bring the matter through and take off the malice of the malefic.`)
      }
    }
  }

  // ── 2. DESTRUCTION of perfection ────────────────────────────────────────────
  let destroyed = false
  if (perfection === 'direct') {
    const prohibitor = findProhibition(qP, tP, chart)
    if (prohibitor && prohibitor !== translator) {
      destroyed = true
      reasons.push(`${prohibitor} perfects its aspect first — prohibition. Another party steps in and the matter is hindered.`)
    }
    if (isRefranated(qP, tP)) {
      destroyed = true
      reasons.push(`A significator turns retrograde before the aspect perfects — refranation. The matter is drawn back before completion.`)
    }
  }

  // ── 3. THE MOON as witness ──────────────────────────────────────────────────
  // Unless she is herself the querent's significator: her motion has then
  // already been read as the perfection above, and counting it again would
  // charge the same fact twice.
  const moonIsQuerent = querent === 'Moon'
  const moon = moonMotion(chart)
  const voidMoon = isMoonVoid(chart)
  if (!moonIsQuerent) {
    if (voidMoon) {
      reasons.push('The Moon is void of course — she performs nothing of herself.')
    } else {
      if (moon.separatingFrom) {
        reasons.push(`The Moon separates from a ${moon.separatingFrom.aspect} of ${moon.separatingFrom.planet} (the recent past of the matter).`)
      }
      if (moon.applyingTo) {
        const toNat = nature(moon.applyingTo.planet)
        reasons.push(`The Moon next applies to a ${moon.applyingTo.aspect} of ${moon.applyingTo.planet}${toNat !== 'neutral' ? ` (a ${toNat})` : ''} — the near future of the matter.`)
      }
    }
  }
  // Lilly weighs the Moon separating from an easy aspect to a hard one, or to a
  // malefic, as testimony against the matter.
  const moonToMalefic =
    !moonIsQuerent &&
    moon.applyingTo != null &&
    nature(moon.applyingTo.planet) === 'malefic' &&
    (moon.applyingTo.aspect === 'square' || moon.applyingTo.aspect === 'opposition')
  if (moonToMalefic) {
    reasons.push(`The Moon applies to a hard aspect of a malefic — an argument against success.`)
  }

  // ── 4. RECEPTION (qualifies the manner, not the fact) ───────────────────────
  const rec = reception(qP, tP)
  if (rec === 'mutual') reasons.push('There is mutual reception between the significators — the parties are well disposed to one another.')
  else if (rec === 'oneway') reasons.push('There is one-way reception — some goodwill, but not equal.')
  else reasons.push('There is no reception between the significators.')

  // ── VERDICT (qualitative) ───────────────────────────────────────────────────
  // yes  : the matter perfects and that perfection is not destroyed.
  // no   : the matter does not perfect, or perfection is destroyed, or (when it
  //        does not perfect) the Moon is void / applies to a malefic by hard aspect.
  // qualified: it perfects, but with a serious impediment against it (Moon void,
  //        Moon to malefic, or the significators debilitated) — it comes about
  //        with difficulty or conditions.
  let verdict: Verdict['verdict']

  if (perfection && !destroyed) {
    const qDign = essentialDignity(querent, qP.lon)
    const tDign = essentialDignity(quesited, tP.lon)
    if (qDign < 0) reasons.push(`${querent} is essentially debilitated (${qDign}) — the querent's side is weak.`)
    if (tDign < 0) reasons.push(`${quesited} is essentially debilitated (${tDign}) — the quesited's side is weak.`)

    // Lilly's caveat on translation: if a significator is an AFFLICTED infortune
    // (a malefic in debility) and is NOT received, the matter is destroyed even
    // though a benefic carries the light. The fortune's help does not extend to
    // an impedited, unreceived malefic. (CA: "the question is destroyed unless
    // the infortune be received.")
    const afflictedUnreceivedMalefic =
      (nature(querent) === 'malefic' && qDign < 0 && reception(qP, tP) === 'none') ||
      (nature(quesited) === 'malefic' && tDign < 0 && reception(qP, tP) === 'none')

    // A fortune strong by dignity carrying the matter takes off ordinary
    // impediments (Lilly: it "performs wholly"). But it cannot save an
    // afflicted, unreceived malefic.
    // When the Moon stands for the querent her void-of-course is not a separate
    // impediment: it is precisely the absence of perfection, already judged.
    const impediment =
      (voidMoon && !moonIsQuerent) || moonToMalefic || qDign < 0 || tDign < 0

    if (afflictedUnreceivedMalefic) {
      verdict = 'qualified'
      reasons.push('A significator is an afflicted, unreceived infortune — even the fortune\'s help brings the matter only with great difficulty.')
    } else if (impediment && !strongBeneficTranslator) {
      verdict = 'qualified'
    } else {
      verdict = 'yes'
    }
  } else {
    verdict = 'no'
    if (destroyed) reasons.push('The matter would have perfected, but a destroying testimony prevents it — the judgment is no.')
    else reasons.push('The significators do not come together by any means — the judgment is no.')
  }

  const timing = (perfection && verdict !== 'no')
    ? estimateTiming(degreesToEvent, perfectingSign)
    : null

  // confidence reflects how clean the testimony is, for display only.
  let confidence = 0.5
  if (verdict === 'yes') confidence = rec === 'mutual' ? 0.85 : 0.7
  else if (verdict === 'no') confidence = destroyed ? 0.75 : 0.8
  else confidence = 0.55

  return { verdict, confidence, reasons, timing }
}
