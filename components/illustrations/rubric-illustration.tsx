/* eslint-disable no-secrets/no-secrets -- inline SVG art: the high-entropy
   strings flagged here are <feGaussianBlur> filter declarations and packed path
   data from the canonical illustration pack, not secrets. */
import { useId, type SVGProps } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Canonical illustration pack — the ONLY illustrations allowed in Rubric.
   Artwork is embedded inline (byte-faithful to the design handoff's
   "Rubric Illustration Pack" showcase) so the bundle is self-contained and
   path-independent. The hex values below are part of the canonical artwork
   (the semantic palette: phosphor #3DFFA2, violet #A78BFA, red #FF5D5D,
   amber #FFC857, empty #5C8A77, cyan #4CC9F0, muted #6E7E8F, hi #E8F0F2) —
   they are illustration art, not component styling. To change a drawing, edit
   the pack and re-sync; never fork it here. Thin-line oscilloscope schematics,
   stroke-only, one glow focal each, transparent background.
   ============================================================================ */
interface ArtAsset {
  vb: string;
  inner: string;
}

const ART = {
  // ---- 01 Identity -------------------------------------------------------
  mark: {
    vb: "0 0 32 32",
    inner:
      '<defs><filter id="mk_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="3.25" y="3.25" width="25.5" height="25.5" rx="6" fill="none" stroke="#3DFFA2" stroke-opacity="0.28" stroke-width="2.5"/><line x1="16" y1="6" x2="16" y2="26" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.4"/><line x1="6" y1="16" x2="26" y2="16" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.4"/><rect x="8" y="18" width="6" height="6" rx="1.4" fill="none" stroke="#3DFFA2" stroke-opacity="0.30" stroke-width="2.5"/><path d="M9 20 l9 -8 l5 4" fill="none" stroke="#3DFFA2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#mk_g)"/><circle cx="23" cy="16" r="2" fill="#3DFFA2" filter="url(#mk_g)"/>',
  },
  wordmark: {
    vb: "0 0 300 64",
    inner:
      '<defs><filter id="wm_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g transform="translate(10 16)"><rect x="3.25" y="3.25" width="25.5" height="25.5" rx="6" fill="none" stroke="#3DFFA2" stroke-opacity="0.28" stroke-width="2.5"/><line x1="16" y1="6" x2="16" y2="26" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.4"/><line x1="6" y1="16" x2="26" y2="16" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.4"/><rect x="8" y="18" width="6" height="6" rx="1.4" fill="none" stroke="#3DFFA2" stroke-opacity="0.30" stroke-width="2.5"/><path d="M9 20 l9 -8 l5 4" fill="none" stroke="#3DFFA2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#wm_g)"/><circle cx="23" cy="16" r="2" fill="#3DFFA2" filter="url(#wm_g)"/></g><text x="56" y="42" font-family="&#39;Space Grotesk&#39;, system-ui, sans-serif" font-size="34" font-weight="600" letter-spacing="-0.7" fill="#E8F0F2">rubric</text>',
  },
  // ---- 02 Zero-data ------------------------------------------------------
  "empty-board": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="eb_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#5C8A77" stroke-opacity="0.35" stroke-width="1.5"/><g stroke="#5C8A77" stroke-opacity="0.14" stroke-width="1"><line x1="8" y1="48" x2="112" y2="48"/><line x1="34" y1="8" x2="34" y2="88"/><line x1="60" y1="8" x2="60" y2="88"/><line x1="86" y1="8" x2="86" y2="88"/></g><line x1="52" y1="48" x2="68" y2="48" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.2"/><line x1="60" y1="40" x2="60" y2="56" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.2"/><line x1="14" y1="48" x2="106" y2="48" stroke="#5C8A77" stroke-width="1.5" stroke-dasharray="2 4" stroke-opacity="0.45"/><text x="60" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">NO SIGNAL</text>',
  },
  "confusion-empty": {
    vb: "0 0 120 96",
    inner:
      '<rect x="30" y="14" width="60" height="60" rx="4" fill="none" stroke="#5C8A77" stroke-opacity="0.35" stroke-width="1.5"/><line x1="60" y1="14" x2="60" y2="74" stroke="#5C8A77" stroke-opacity="0.22" stroke-width="1.2"/><line x1="30" y1="44" x2="90" y2="44" stroke="#5C8A77" stroke-opacity="0.22" stroke-width="1.2"/><line x1="30" y1="10" x2="90" y2="10" stroke="#5C8A77" stroke-opacity="0.18" stroke-width="1"/><line x1="26" y1="14" x2="26" y2="74" stroke="#5C8A77" stroke-opacity="0.18" stroke-width="1"/><text x="60" y="86" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">2×2 · UNFILLED</text>',
  },
  "off-bench": {
    vb: "0 0 120 96",
    inner:
      '<rect x="14" y="30" width="40" height="36" rx="5" fill="none" stroke="#5C8A77" stroke-opacity="0.35" stroke-width="1.5"/><g stroke="#5C8A77" stroke-opacity="0.16" stroke-width="1"><line x1="14" y1="48" x2="54" y2="48"/></g><path d="M34 48 l-2 -3 l4 0 l-2 3" fill="none" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.2"/><path d="M54 48 h10" stroke="#5C8A77" stroke-opacity="0.45" stroke-width="1.5"/><circle cx="66" cy="48" r="3" fill="none" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.5"/><path d="M78 48 h8" stroke="#5C8A77" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="2 3"/><circle cx="76" cy="48" r="2.4" fill="none" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.5"/><rect x="92" y="36" width="14" height="24" rx="3" fill="none" stroke="#5C8A77" stroke-opacity="0.35" stroke-width="1.5"/><text x="60" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">UNPLUGGED</text>',
  },
  // ---- 03 Healthy --------------------------------------------------------
  "passing-trace": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="pt_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"/><g stroke="#3DFFA2" stroke-opacity="0.10" stroke-width="1"><line x1="8" y1="34" x2="112" y2="34"/><line x1="8" y1="60" x2="112" y2="60"/><line x1="42" y1="8" x2="42" y2="88"/><line x1="76" y1="8" x2="76" y2="88"/></g><path d="M12 30 C26 30 30 22 44 24 S70 30 84 26 100 22 108 24" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round" filter="url(#pt_g)"/><circle cx="108" cy="24" r="3.2" fill="#3DFFA2" filter="url(#pt_g)"/><text x="60" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">94.2% PASS</text>',
  },
  "clean-signal": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="cs_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="20" y="12" width="80" height="68" rx="6" fill="none" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"/><line x1="22" y1="78" x2="98" y2="14" stroke="#3DFFA2" stroke-opacity="0.30" stroke-width="1.2" stroke-dasharray="3 3"/><g fill="#3DFFA2"><circle cx="30" cy="70" r="2"/><circle cx="42" cy="62" r="2"/><circle cx="52" cy="53" r="2"/><circle cx="60" cy="46" r="2"/><circle cx="70" cy="37" r="2"/><circle cx="80" cy="29" r="2"/><circle cx="90" cy="22" r="2.6" filter="url(#cs_g)"/></g><text x="60" y="90" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">ON DIAGONAL</text>',
  },
  "gate-open": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="go_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M30 22 L22 22 L22 74 L30 74" fill="none" stroke="#3DFFA2" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/><path d="M90 22 L98 22 L98 74 L90 74" fill="none" stroke="#3DFFA2" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/><line x1="30" y1="48" x2="78" y2="48" stroke="#3DFFA2" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M70 48 l6 -4 m-6 4 l6 4" fill="none" stroke="#3DFFA2" stroke-width="1.6" stroke-linecap="round"/><circle cx="60" cy="33" r="9" fill="none" stroke="#3DFFA2" stroke-width="1.6" filter="url(#go_g)"/><path d="M56 33 l3 3 l5 -6" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#go_g)"/><text x="60" y="84" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">GATE OPEN</text>',
  },
  // ---- 04 Failure --------------------------------------------------------
  "regression-drop": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="rd_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#3DFFA2" stroke-opacity="0.14" stroke-width="1.5"/><g stroke="#3DFFA2" stroke-opacity="0.09" stroke-width="1"><line x1="8" y1="34" x2="112" y2="34"/><line x1="8" y1="60" x2="112" y2="60"/></g><path d="M12 30 C24 30 32 26 44 28 S58 30 62 32" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round"/><path d="M62 32 L66 66 C70 70 76 70 80 68 S96 66 108 66" fill="none" stroke="#FF5D5D" stroke-width="1.8" stroke-linecap="round" filter="url(#rd_g)"/><line x1="62" y1="22" x2="62" y2="74" stroke="#FF5D5D" stroke-opacity="0.30" stroke-width="1" stroke-dasharray="2 3"/><circle cx="64" cy="49" r="3" fill="#FF5D5D" filter="url(#rd_g)"/><text x="60" y="82" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">−4.2 PT CLIFF</text>',
  },
  "broken-feed": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="bf_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#FF5D5D" stroke-opacity="0.18" stroke-width="1.5"/><path d="M12 46 h14 l5 -10 l4 18 l6 -8 h6" fill="none" stroke="#FF5D5D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#bf_g)"/><path d="M64 60 h8 l4 -14 l3 10 h6" fill="none" stroke="#FF5D5D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8"/><g stroke="#FF5D5D" stroke-opacity="0.5" stroke-width="1.4"><line x1="48" y1="30" x2="56" y2="30"/><line x1="92" y1="36" x2="100" y2="36"/><line x1="40" y1="68" x2="48" y2="68"/><line x1="86" y1="64" x2="96" y2="64"/></g><line x1="52" y1="14" x2="52" y2="82" stroke="#FF5D5D" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="3 4"/><text x="60" y="82" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">SIGNAL LOST</text>',
  },
  "gate-blocked": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="gb_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M30 22 L22 22 L22 74 L30 74" fill="none" stroke="#FF5D5D" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/><path d="M90 22 L98 22 L98 74 L90 74" fill="none" stroke="#FF5D5D" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/><g stroke="#FF5D5D" stroke-opacity="0.5" stroke-width="1.6"><line x1="40" y1="34" x2="80" y2="34"/><line x1="40" y1="48" x2="80" y2="48"/><line x1="40" y1="62" x2="80" y2="62"/></g><circle cx="60" cy="48" r="11" fill="none" stroke="#FF5D5D" stroke-width="1.8" filter="url(#gb_g)"/><line x1="53" y1="55" x2="67" y2="41" stroke="#FF5D5D" stroke-width="1.8" stroke-linecap="round" filter="url(#gb_g)"/><text x="60" y="86" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">GATE BLOCKED</text>',
  },
  // ---- 05 Stale / flaky / drift -----------------------------------------
  "flatline-stale": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="fs_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#3DFFA2" stroke-opacity="0.12" stroke-width="1.5"/><g stroke="#3DFFA2" stroke-opacity="0.08" stroke-width="1"><line x1="8" y1="48" x2="112" y2="48"/></g><path d="M12 50 C22 50 26 40 34 42 S46 52 54 48" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.5"/><line x1="54" y1="48" x2="104" y2="48" stroke="#FFC857" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/><circle cx="104" cy="48" r="3" fill="#FFC857" filter="url(#fs_g)"/><text x="60" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">31H STALE</text>',
  },
  "flatline-flaky": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="ff_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#FFC857" stroke-opacity="0.16" stroke-width="1.5"/><g stroke="#FFC857" stroke-opacity="0.10" stroke-width="1"><line x1="8" y1="36" x2="112" y2="36"/><line x1="8" y1="60" x2="112" y2="60"/></g><path d="M12 36 L24 36 L24 60 L36 60 L36 36 L48 36 L48 60 L60 60 L60 36 L72 36 L72 60 L84 60 L84 36 L96 36 L96 60 L108 60" fill="none" stroke="#FFC857" stroke-width="1.6" stroke-linejoin="round" filter="url(#ff_g)"/><text x="60" y="82" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">FLAKY ±</text>',
  },
  "scatter-drift": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="sd_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="20" y="12" width="80" height="68" rx="6" fill="none" stroke="#FFC857" stroke-opacity="0.14" stroke-width="1.5"/><line x1="22" y1="78" x2="98" y2="14" stroke="#FFC857" stroke-opacity="0.30" stroke-width="1.2" stroke-dasharray="3 3"/><g fill="#FFC857"><circle cx="34" cy="66" r="2"/><circle cx="44" cy="60" r="2"/><circle cx="54" cy="56" r="2"/><circle cx="64" cy="50" r="2"/><circle cx="74" cy="48" r="2"/><circle cx="84" cy="44" r="2.6" filter="url(#sd_g)"/></g><path d="M86 40 l8 -2 l-3 6" fill="none" stroke="#FFC857" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="90" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">DRIFT +BIAS</text>',
  },
  // ---- 06 Judge / AI -----------------------------------------------------
  "judge-orb-idle": {
    vb: "0 0 120 110",
    inner:
      '<g transform="translate(60 52)"><ellipse rx="42" ry="17" fill="none" stroke="#A78BFA" stroke-opacity="0.20" stroke-width="1.5" transform="rotate(-24)"/><ellipse rx="42" ry="17" fill="none" stroke="#A78BFA" stroke-opacity="0.14" stroke-width="1.5" transform="rotate(28)"/><circle r="9" fill="none" stroke="#A78BFA" stroke-opacity="0.40" stroke-width="1.6"/><circle r="2.6" fill="#A78BFA" fill-opacity="0.55"/></g><text x="60" y="100" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">JUDGE IDLE</text>',
  },
  "judge-orb-active": {
    vb: "0 0 120 110",
    inner:
      '<defs><filter id="joa_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><style>@keyframes rb_orb_pulse{0%,100%{opacity:.55}50%{opacity:1}}.rb_orb_pulse{animation:rb_orb_pulse 2.4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.rb_orb_pulse{animation:none;opacity:1}}</style></defs><g transform="translate(60 52)"><ellipse rx="42" ry="17" fill="none" stroke="#A78BFA" stroke-opacity="0.45" stroke-width="1.6" transform="rotate(-24)"/><ellipse rx="42" ry="17" fill="none" stroke="#A78BFA" stroke-opacity="0.32" stroke-width="1.6" transform="rotate(28)"/><circle class="rb_orb_pulse" r="13" fill="#A78BFA" fill-opacity="0.10"/><circle r="9" fill="none" stroke="#A78BFA" stroke-width="1.8" filter="url(#joa_g)"/><circle r="3.4" fill="#A78BFA" filter="url(#joa_g)"/><circle cx="-32" cy="-8" r="2" fill="#A78BFA" fill-opacity="0.8"/><circle cx="34" cy="9" r="2" fill="#A78BFA" fill-opacity="0.8"/></g><text x="60" y="100" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">JUDGE ACTIVE</text>',
  },
  "divergence-fork": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="df_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M14 48 H52" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.6"/><circle cx="52" cy="48" r="3" fill="none" stroke="#A78BFA" stroke-width="1.5"/><path d="M55 46 C70 40 86 30 104 28" fill="none" stroke="#3DFFA2" stroke-width="1.8" stroke-linecap="round" filter="url(#df_g)"/><path d="M55 50 C70 56 86 66 104 68" fill="none" stroke="#FFC857" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="4 3"/><circle cx="104" cy="28" r="2.8" fill="#3DFFA2" filter="url(#df_g)"/><circle cx="104" cy="68" r="2.8" fill="#FFC857"/><text x="60" y="86" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">FORK · ALT PATH</text>',
  },
  // ---- 07 Clusters -------------------------------------------------------
  "cluster-bloom": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="cb_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M22 36 Q20 22 36 22 Q52 20 52 36 Q54 50 38 50 Q22 50 22 36 Z" fill="#3DFFA2" fill-opacity="0.06" stroke="#3DFFA2" stroke-opacity="0.30" stroke-width="1.2"/><g fill="none" stroke="#3DFFA2" stroke-width="1.4" stroke-opacity="0.7"><rect x="29" y="29" width="5" height="5" rx="1"/><rect x="40" y="32" width="5" height="5" rx="1"/><rect x="34" y="40" width="5" height="5" rx="1"/></g><path d="M72 30 Q70 18 84 18 Q98 18 98 32 Q98 44 84 44 Q72 44 72 30 Z" fill="#FFC857" fill-opacity="0.06" stroke="#FFC857" stroke-opacity="0.30" stroke-width="1.2"/><g fill="none" stroke="#FFC857" stroke-width="1.4" stroke-opacity="0.7"><rect x="79" y="25" width="5" height="5" rx="1"/><rect x="88" y="30" width="5" height="5" rx="1"/></g><path d="M44 70 Q42 58 56 58 Q72 58 72 70 Q72 82 56 82 Q44 82 44 70 Z" fill="#FF5D5D" fill-opacity="0.06" stroke="#FF5D5D" stroke-opacity="0.30" stroke-width="1.2"/><g fill="none" stroke="#FF5D5D" stroke-width="1.4" stroke-opacity="0.8"><rect x="51" y="64" width="5" height="5" rx="1"/><rect x="60" y="68" width="5" height="5" rx="1"/><rect x="54" y="73" width="5" height="5" rx="1" filter="url(#cb_g)"/></g>',
  },
  "trace-sprite": {
    vb: "0 0 16 16",
    inner:
      '<defs><filter id="ts_g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M1 11 L5 11 L7 5 L9 9 L11 7 L15 7" fill="none" stroke="#3DFFA2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#ts_g)"/><circle cx="15" cy="7" r="1.4" fill="#3DFFA2"/>',
  },
  "loading-sweep": {
    vb: "0 0 120 96",
    inner:
      '<defs><clipPath id="ls_clip"><rect x="8" y="8" width="104" height="80" rx="7"/></clipPath><linearGradient id="ls_bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3DFFA2" stop-opacity="0"/><stop offset="0.5" stop-color="#3DFFA2" stop-opacity="0.45"/><stop offset="1" stop-color="#3DFFA2" stop-opacity="0"/></linearGradient><style>@keyframes rb_sweep_bar{0%{transform:translateX(-10%)}100%{transform:translateX(110%)}}.rb_sweep_bar{animation:rb_sweep_bar 1.8s cubic-bezier(0.22,1,0.36,1) infinite}@media (prefers-reduced-motion:reduce){.rb_sweep_bar{animation:none;transform:translateX(46%)}}</style></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"/><g stroke="#3DFFA2" stroke-opacity="0.08" stroke-width="1"><line x1="8" y1="34" x2="112" y2="34"/><line x1="8" y1="60" x2="112" y2="60"/><line x1="42" y1="8" x2="42" y2="88"/><line x1="76" y1="8" x2="76" y2="88"/></g><g clip-path="url(#ls_clip)"><rect class="rb_sweep_bar" x="0" y="8" width="34" height="80" fill="url(#ls_bar)"/></g><text x="60" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">SCANNING…</text>',
  },
  // ---- 08 System states --------------------------------------------------
  "not-found-404": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="nf_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="92" height="80" rx="7" fill="none" stroke="#5C8A77" stroke-opacity="0.30" stroke-width="1.5"/><g stroke="#5C8A77" stroke-opacity="0.12" stroke-width="1"><line x1="8" y1="48" x2="100" y2="48"/><line x1="38" y1="8" x2="38" y2="88"/><line x1="70" y1="8" x2="70" y2="88"/></g><line x1="14" y1="48" x2="96" y2="48" stroke="#5C8A77" stroke-opacity="0.40" stroke-width="1.4" stroke-dasharray="2 4"/><circle cx="110" cy="30" r="9" fill="none" stroke="#5C8A77" stroke-opacity="0.5" stroke-width="1.5" filter="url(#nf_g)"/><text x="110" y="34" text-anchor="middle" fill="#5C8A77" font-family="JetBrains Mono, monospace" font-weight="600" font-size="11">?</text><path d="M100 40 L106 36" stroke="#5C8A77" stroke-opacity="0.4" stroke-width="1.2" stroke-dasharray="2 2"/><text x="54" y="80" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">OFF-SCREEN</text>',
  },
  "session-expired": {
    vb: "0 0 120 96",
    inner:
      '<defs><filter id="se_g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="8" y="8" width="104" height="80" rx="7" fill="none" stroke="#FFC857" stroke-opacity="0.14" stroke-width="1.5"/><g stroke="#FFC857" stroke-opacity="0.08" stroke-width="1"><line x1="8" y1="34" x2="112" y2="34"/><line x1="8" y1="60" x2="112" y2="60"/></g><path d="M12 40 C22 40 26 30 34 32 S44 42 50 40" fill="none" stroke="#FFC857" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.45"/><line x1="50" y1="40" x2="56" y2="40" stroke="#FFC857" stroke-width="1.6" stroke-opacity="0.45"/><rect x="50" y="44" width="20" height="16" rx="2.5" fill="none" stroke="#FFC857" stroke-width="1.6" filter="url(#se_g)"/><path d="M54 44 v-4 a6 6 0 0 1 12 0 v4" fill="none" stroke="#FFC857" stroke-width="1.6"/><circle cx="60" cy="52" r="1.8" fill="#FFC857"/><text x="60" y="82" text-anchor="middle" fill="#6E7E8F" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing="1.5">FROZEN · LOCKED</text>',
  },
} satisfies Record<string, ArtAsset>;

type CanonicalName = keyof typeof ART;

/** Named asset from the canonical illustration pack. */
export type RubricIllustrationName = CanonicalName;

/**
 * Renders a named asset from the canonical Rubric illustration pack — the only
 * illustrations allowed in product screens. Filter / gradient / clip ids are
 * namespaced per instance via useId() so multiple illustrations can share a
 * page without id collisions. Animated assets (loading-sweep, judge-orb-active)
 * carry a reduced-motion off-switch defined in app/globals.css.
 */
export interface RubricIllustrationProps
  extends Omit<SVGProps<SVGSVGElement>, "name"> {
  /** @default 'empty-board' */
  name?: RubricIllustrationName;
  /** Rendered width in px (height derives from the asset's aspect ratio). @default 120 */
  size?: number;
}

export function RubricIllustration({
  name = "empty-board",
  size = 120,
  className,
  style,
  ...rest
}: RubricIllustrationProps) {
  const art = ART[name];
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9]/g, "");
  const inner = art.inner
    .replace(/id="([^"]+)"/g, (_m: string, p: string) => `id="${p}-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, (_m: string, p: string) => `url(#${p}-${uid})`);
  const parts = art.vb.split(/\s+/);
  const vw = Number.parseFloat(parts[2] ?? "") || 1;
  const vh = Number.parseFloat(parts[3] ?? "") || 1;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={art.vb}
      width={size}
      height={Math.round(size * (vh / vw))}
      fill="none"
      aria-hidden
      className={cn(className)}
      style={{ display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
      {...rest}
    />
  );
}
