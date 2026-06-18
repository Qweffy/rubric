"use client";

import { useId, useState } from "react";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";
import { Icon } from "@/components/ui/icon";

/**
 * Clipped-matrix illustration: a wide score-matrix + waveform clipped by a
 * narrow phone frame, with dashed expansion arrows pointing outward — "this
 * instrument needs more width." Ported byte-faithfully from the design handoff
 * (Rubric Small Viewport Notice.dc.html). Raw hex is intentional here: this is
 * canonical illustration art, not component styling.
 */
function ClippedMatrix({ size = 200 }: { size?: number }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const clip = `phoneClip-${uid}`;
  const glow = `glow-${uid}`;
  return (
    <svg
      viewBox="0 0 240 140"
      width={size}
      height={Math.round(size * (140 / 240))}
      fill="none"
      aria-hidden="true"
      style={{ display: "block", margin: "4px 0" }}
    >
      <defs>
        <clipPath id={clip}>
          <rect x="92" y="26" width="56" height="92" rx="9" />
        </clipPath>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3DFFA2" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3DFFA2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <g stroke="#4CC9F0" strokeOpacity="0.30" strokeWidth="1.5">
          <line x1="30" y1="44" x2="210" y2="44" />
          <line x1="30" y1="62" x2="210" y2="62" />
          <line x1="30" y1="80" x2="210" y2="80" />
          <line x1="30" y1="98" x2="210" y2="98" />
          <line x1="56" y1="34" x2="56" y2="112" />
          <line x1="92" y1="34" x2="92" y2="112" />
          <line x1="128" y1="34" x2="128" y2="112" />
          <line x1="164" y1="34" x2="164" y2="112" />
        </g>
        <path
          d="M30 84 L48 84 L56 64 L72 64 L80 96 L96 96 L104 56 L120 56 L128 88 L150 88 L158 70 L182 70 L190 90 L210 90"
          stroke="#3DFFA2"
          strokeOpacity="0.85"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="104" cy="56" r="2.6" fill="#3DFFA2" />
      </g>
      <circle cx="120" cy="72" r="30" fill={`url(#${glow})`} />
      <rect
        x="92"
        y="26"
        width="56"
        height="92"
        rx="9"
        fill="none"
        stroke="#E8F0F2"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect x="108" y="31" width="24" height="2.4" rx="1.2" fill="#E8F0F2" fillOpacity="0.28" />
      <g
        stroke="#5C6B7A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
      >
        <line x1="84" y1="72" x2="40" y2="72" />
        <line x1="156" y1="72" x2="200" y2="72" />
      </g>
      <g
        stroke="#5C6B7A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M46 66 L38 72 L46 78" />
        <path d="M194 66 L202 72 L194 78" />
      </g>
    </svg>
  );
}

/**
 * SmallViewportNotice — the calm full-stop shown below 1024px. Wordmark lockup,
 * clipped-matrix illustration, the "Built for a larger screen." headline, the
 * mono min/optimal-width spec, and a Copy-desktop-link button. Rendered only by
 * the DesktopGate, so the heavy console subtree never mounts behind it.
 */
export function SmallViewportNotice() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const href = typeof window === "undefined" ? "" : window.location.href;
    if (href === "") return;
    void navigator.clipboard
      .writeText(href)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div
      className="notice-bg flex h-dvh w-full flex-col items-center justify-center"
      style={{
        background: "var(--surface-page)",
        backgroundImage:
          "radial-gradient(rgba(61,255,162,0.045) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        padding: "48px 35px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ gap: 22, maxWidth: 320, position: "relative", zIndex: 2 }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <RubricIllustration name="mark" size={22} />
          <span
            style={{
              font: "600 16px/1 var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--text-hi)",
            }}
          >
            rubric
          </span>
        </div>

        <ClippedMatrix size={200} />

        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <h2
            style={{
              font: "600 22px/1.2 var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--text-hi)",
              margin: 0,
            }}
          >
            Built for a larger screen.
          </h2>
          <p
            style={{
              font: "var(--text-sm)",
              color: "var(--text-mid)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            rubric is a regression-gating instrument — its score matrices,
            confusion heatmaps and prompt diffs need room to read. Open it on a
            desktop (&ge; 1024px) to see the full console.
          </p>
        </div>

        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--phosphor)",
              boxShadow: "0 0 7px var(--phosphor)",
              flex: "none",
            }}
          />
          <span
            className="mono"
            style={{
              font: "var(--mono-sm)",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--text-low-content)",
            }}
          >
            MIN WIDTH 1024PX · OPTIMAL 1280PX
          </span>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="rb-focus-btn inline-flex items-center justify-center"
          style={{
            marginTop: 2,
            gap: 9,
            height: 40,
            padding: "0 18px",
            borderRadius: "var(--radius-control)",
            font: "600 13px/1 var(--font-ui)",
            background: "transparent",
            color: "var(--text-hi)",
            border: "1px solid var(--border-strong)",
            cursor: "pointer",
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={15} strokeWidth={1.7} />
          {copied ? "Link copied" : "Copy desktop link"}
        </button>
      </div>

      <style>{`
.notice-bg::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(180deg,rgba(61,255,162,0.018) 0px,rgba(61,255,162,0.018) 1px,transparent 1px,transparent 4px);}
.notice-bg::after{content:"";position:absolute;left:0;right:0;height:120px;top:-120px;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(61,255,162,0.05),transparent);
  animation:rb-nv-scan 5.5s linear infinite;}
@keyframes rb-nv-scan{0%{transform:translateY(0)}100%{transform:translateY(calc(100% + 240px))}}
.rb-focus-btn{transition:border-color 140ms var(--ease-out),box-shadow 140ms var(--ease-out);}
.rb-focus-btn:hover{border-color:color-mix(in srgb,var(--phosphor) 50%,transparent);}
.rb-focus-btn:focus-visible{outline:none;border-color:var(--phosphor);box-shadow:var(--glow-phosphor-sm);}
@media (prefers-reduced-motion:reduce){.notice-bg::after{animation:none;display:none;}}
`}</style>
    </div>
  );
}
