import { SectionLabel } from "@/components/ui/section-label";
import { LoadingSweep } from "@/components/ui/skeleton";

/**
 * Global route loading state (GLOBAL STATES · 8 in the App Shell handoff). The
 * shell chrome — sidebar, glass topbar, key-hint strip — always survives; only
 * the content region swaps to skeletons under a phosphor scan line. Geometry
 * mirrors the Suites overview it stands in for: header (title + action),
 * four scorecards, three table rows, then a SCANNING footer. The sweep and
 * skeleton shimmer both go static under prefers-reduced-motion (the global
 * guards in app/globals.css), so the panel never animates for those users.
 */
export default function AppLoading() {
  return (
    <div className="absolute inset-0 overflow-auto" style={{ padding: 24 }}>
      <div
        className="mx-auto flex flex-col"
        style={{ maxWidth: "var(--maxw-content)", gap: 14 }}
      >
        <LoadingSweep
          className="flex flex-col"
          style={{ gap: 14, padding: 18 }}
          distance={1180}
          duration="1.8s"
        >
          {/* header — page title + primary action */}
          <div className="flex items-center justify-between">
            <div className="hr-skeleton" style={{ height: 22, width: 120 }} />
            <div
              className="hr-skeleton"
              style={{ height: 30, width: 110, borderRadius: "var(--radius-control)" }}
            />
          </div>

          {/* scorecard strip */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
          >
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="flex flex-col"
                style={{
                  gap: 12,
                  padding: 14,
                  background: "var(--surface-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="hr-skeleton" style={{ height: 10, width: "60%" }} />
                <div className="hr-skeleton" style={{ height: 24, width: "80%" }} />
              </div>
            ))}
          </div>

          {/* suite-index rows */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            {[
              { name: "50%", branch: "60%", badge: "80%" },
              { name: "40%", branch: "55%", badge: "75%" },
              { name: "46%", branch: "50%", badge: "82%" },
            ].map((row, i) => (
              <div
                key={i}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "1fr 90px 110px",
                  gap: 16,
                  padding: "11px 14px",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                }}
              >
                <div className="hr-skeleton" style={{ height: 14, width: row.name }} />
                <div className="hr-skeleton" style={{ height: 14, width: row.branch }} />
                <div
                  className="hr-skeleton"
                  style={{ height: 18, width: row.badge, borderRadius: "var(--radius-sm)" }}
                />
              </div>
            ))}
          </div>

          {/* scanning footer */}
          <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
            <SectionLabel tone="phosphor">SCANNING</SectionLabel>
            <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
              loading-sweep · static under reduced-motion
            </span>
          </div>
        </LoadingSweep>
      </div>
    </div>
  );
}
