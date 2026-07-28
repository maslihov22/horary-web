import type { Chart, Verdict, PlanetName, PlanetPos } from '../types'
import { rulerOfHouse, essentialDignity, signOf } from './rulerships'
import { normalizeDeg } from '../astro/angles'
import { findAspect } from './aspects'
import { reception } from './receptions'
import { isMoonVoid } from './voidofcourse'
import { estimateTiming } from './timing'
import { findTranslation, findCollection } from './translation'
import { findAntiscionLink } from './antiscia'
import { isBesieged } from './besiegement'
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

  // ── 0. CONSIDERATIONS BEFORE JUDGEMENT ──────────────────────────────────────
  // Lilly, Aphorism 2: "Be not confident of the Judgment if either the 1st
  // degrees or later of any Signe be ascending; if few degrees ascend, matter
  // is not yet ripe for judgment[;] if the later degrees arise, the matter of
  // the question is elapsed."
  //
  // He withholds confidence, not judgement — "be not confident", not "judge
  // not" — so the caution is recorded and the figure is still read.
  const ascDegree = normalizeDeg(chart.cusps[1]) % 30
  let unripe = false
  if (ascDegree < 3) {
    unripe = true
    reasons.push('Few degrees ascend — the matter is not yet ripe for judgment, and the figure is not to be trusted far.')
  } else if (ascDegree >= 27) {
    unripe = true
    reasons.push('The later degrees of the sign ascend — the matter of the question is elapsed, and the figure is not to be trusted far.')
  }

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
        confidence: unripe ? 0.18 : 0.3,
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
  let perfection: 'direct' | 'translation' | 'collection' | 'antiscion' | null = null
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
  let collector: PlanetName | null = null
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
    } else {
      // Collection: the last of Lilly's three ways to perfection. A weightier
      // planet, received by both significators, gathers their light and
      // "brings the thing demanded to perfection".
      const col = findCollection(qP, tP, others)
      if (col) {
        perfection = 'collection'
        collector = col.collector
        perfectingSign = signOf(chart.planets[col.collector].lon)
        reasons.push(col.detail)
      }
    }
  }

  // Antiscia join two planets in secret where no aspect does. Lilly counts them
  // as real testimony but secondary, so they are recorded and — for the
  // antiscion, which acts as a hidden conjunction — allowed to bring the matter
  // together where nothing else did. The contra-antiscion argues against.
  const antisciaLink = findAntiscionLink(qP, tP)
  if (antisciaLink) {
    reasons.push(antisciaLink.detail)
    if (!perfection && antisciaLink.kind === 'antiscion') {
      perfection = 'antiscion'
      perfectingSign = signOf(tP.lon)
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

    // Lilly: a planet hemmed in between the bodies of both infortunes "is in
    // great affliction" — it can move no way without meeting a malefic.
    const qBesieged = isBesieged(querent, chart)
    const tBesieged = isBesieged(quesited, chart)
    if (qBesieged) reasons.push(`${querent} is besieged between the two infortunes — the querent is in great affliction and hemmed in on every side.`)
    if (tBesieged) reasons.push(`${quesited} is besieged between the two infortunes — the matter itself is hemmed in and sorely afflicted.`)

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
      (voidMoon && !moonIsQuerent) || moonToMalefic || qDign < 0 || tDign < 0 ||
      qBesieged || tBesieged

    if (afflictedUnreceivedMalefic) {
      verdict = 'qualified'
      reasons.push('A significator is an afflicted, unreceived infortune — even the fortune\'s help brings the matter only with great difficulty.')
    } else if (impediment && !strongBeneficTranslator) {
      verdict = 'qualified'
    } else if (collector) {
      // The matter perfects, but nothing the principals do brings it about:
      // it hangs on the collector's good offices.
      verdict = 'qualified'
      reasons.push(`The matter is concluded not by the principals themselves but by ${collector} — it holds, but it depends on that third party.`)
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

  // The considerations bear on how far the figure may be trusted, which is
  // exactly what this number reports.
  if (unripe) confidence = Math.round(confidence * 0.6 * 100) / 100

  return { verdict, confidence, reasons, timing }
}
