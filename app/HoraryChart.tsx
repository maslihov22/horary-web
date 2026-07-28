"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
// astrochart draws SVG into a DOM node — client only.
import { Chart } from "@astrodraw/astrochart";
import type { PlanetName } from "@/engine";

export interface ChartData {
  planets: Record<PlanetName, number>; // ecliptic longitude, degrees
  cusps: number[]; // 12 house cusps, degrees
  translation?: { from: PlanetName; via: PlanetName; to: PlanetName } | null;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function HoraryChart({ data, animate = true }: { data: ChartData; animate?: boolean }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    let timer = 0;
    // Read CSS variables and draw only AFTER the browser has applied the
    // current theme (next-themes just changed data-theme). Reading synchronously
    // here races the cascade and picks up the previous theme's colors.
    const raf = requestAnimationFrame(() => {
      paper.innerHTML = "";

      const fg = cssVar("--fg");
      const muted = cssVar("--muted");
      const ink = cssVar("--stroke");
      const gold = cssVar("--gold");
      const verd = cssVar("--verdigris");
      const verm = cssVar("--vermilion");

    const settings = {
      SYMBOL_SCALE: 1.9,
      STROKE_ONLY: true,
      COLOR_BACKGROUND: "transparent",
      POINTS_COLOR: fg,
      SIGNS_COLOR: muted,
      CIRCLE_COLOR: ink,
      LINE_COLOR: ink,
      CUSPS_FONT_COLOR: gold,
      SYMBOL_AXIS_FONT_COLOR: gold,
      CUSPS_STROKE: 0.8,
      CIRCLE_STRONG: 1.4,
      POINTS_STROKE: 1.6,
      SIGNS_STROKE: 1.3,
      POINTS_TEXT_SIZE: 12,
      MARGIN: 90,
      ASPECTS: {
        conjunction: { degree: 0, orbit: 8, color: "transparent" },
        sextile: { degree: 60, orbit: 6, color: verd },
        square: { degree: 90, orbit: 8, color: verm },
        trine: { degree: 120, orbit: 8, color: verd },
        opposition: { degree: 180, orbit: 8, color: verm },
      },
    };

    const radixData = {
      planets: Object.fromEntries(
        Object.entries(data.planets).map(([k, v]) => [k, [v]]),
      ),
      cusps: data.cusps,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = new Chart("horary-paper", 1000, 1000, settings as any);
    const radix = chart.radix(radixData);
    radix.addPointsOfInterest({
      As: [data.cusps[0]],
      Ic: [data.cusps[3]],
      Ds: [data.cusps[6]],
      Mc: [data.cusps[9]],
    });
    radix.aspects();

    timer = window.setTimeout(() => {
      const svg = paper.querySelector("svg");
      if (!svg) return;
      const vb = svg.viewBox.baseVal;
      const cx = vb.width / 2;
      const cy = vb.height / 2;
      const NS = "http://www.w3.org/2000/svg";

      // translation-of-light thread, gold, on the aspect ring
      const goldLines: SVGLineElement[] = [];
      if (data.translation) {
        const r = vb.width * 0.28;
        const pt = (lon: number): [number, number] => {
          const a = ((lon - data.cusps[0]) * Math.PI) / 180;
          const ang = Math.PI + a;
          return [cx + Math.cos(ang) * r, cy - Math.sin(ang) * r];
        };
        const tr = data.translation;
        const s = pt(data.planets[tr.from]);
        const v = pt(data.planets[tr.via]);
        const o = pt(data.planets[tr.to]);
        ([[s, v], [v, o]] as [number, number][][]).forEach((seg) => {
          const l = document.createElementNS(NS, "line");
          l.setAttribute("x1", String(seg[0][0]));
          l.setAttribute("y1", String(seg[0][1]));
          l.setAttribute("x2", String(seg[1][0]));
          l.setAttribute("y2", String(seg[1][1]));
          l.setAttribute("stroke", gold);
          l.setAttribute("stroke-width", "1.8");
          svg.appendChild(l);
          goldLines.push(l);
        });
      }

      // Draw-on plays once (first cast). On re-renders — theme switch, new
      // data — the chart is redrawn statically and fully visible, so glyphs
      // never get stuck mid-stroke.
      const shouldAnimate =
        animate &&
        !didAnimate.current &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      didAnimate.current = true;
      if (!shouldAnimate) return;

      // draw-on: the hand casts the figure. Only the large structure (rings and
      // house lines) is "drawn" by stroke-dash. Glyph paths and text labels fade
      // in — animating a tiny glyph's stroke can leave it stuck mid-draw.
      const structure: SVGGraphicsElement[] = [];
      const symbols: SVGGraphicsElement[] = [];
      svg.querySelectorAll("circle,line,path,text").forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === "circle" || tag === "line") structure.push(el as SVGGraphicsElement);
        else symbols.push(el as SVGGraphicsElement); // path glyphs + text
      });

      const len = (el: SVGGraphicsElement): number => {
        const g = el as unknown as { getTotalLength?: () => number };
        try {
          if (g.getTotalLength) return g.getTotalLength();
        } catch {
          /* fall through */
        }
        const b = el.getBBox();
        return (b.width + b.height) * 2 || 400;
      };

      let d = 0;
      const step = 0.045;
      structure.forEach((el) => {
        let L = len(el);
        if (!isFinite(L) || L <= 0) L = 400;
        el.style.strokeDasharray = String(L);
        el.style.strokeDashoffset = String(L);
        el.style.animation = "hDraw 1.1s ease forwards";
        el.style.animationDelay = `${d}s`;
        d += step;
      });
      goldLines.forEach((l, i) => {
        const L = l.getTotalLength();
        l.style.strokeDasharray = String(L);
        l.style.strokeDashoffset = String(L);
        l.style.animation = "hDraw 0.9s ease forwards";
        l.style.animationDelay = `${d + 0.2 + i * 0.15}s`;
      });
      symbols.forEach((tEl, i) => {
        tEl.style.opacity = "0";
        tEl.style.animation = "hFade 0.6s ease forwards";
        tEl.style.animationDelay = `${d * 0.55 + i * 0.02}s`;
      });
      }, 30);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [data, animate, resolvedTheme]);

  return (
    <div
      id="horary-paper"
      ref={paperRef}
      style={{ width: "100%" }}
      role="img"
      aria-label="Horary chart in the traditional style"
    />
  );
}
