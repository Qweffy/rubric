import { ErrorWorkbenchView } from "@/components/errors/error-workbench-view";
import { getErrorClusters } from "@/lib/queries/errors";

// The workbench reflects the latest failed run's clusters; clusters are
// re-derived whenever a run lands and a promotion mutates the golden set, so
// the read must never be statically cached.
export const dynamic = "force-dynamic";

/** Two-digit zero-padded UTC clock, e.g. "09:13 UTC", for the export readout. */
function utcClock(at: Date): string {
  const hh = String(at.getUTCHours()).padStart(2, "0");
  const mm = String(at.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

interface ErrorsPageProps {
  // Next 16: params / searchParams are Promises. The workbench has no dynamic
  // segment, but searchParams is awaited so a future `?cluster=` deep-link can
  // pre-select a tile without changing the contract.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ErrorsPage({ searchParams }: ErrorsPageProps) {
  const [{ summary, clusters }, params] = await Promise.all([
    getErrorClusters(),
    searchParams,
  ]);

  // The head run / suite context for the header strip comes off the first
  // (largest) cluster — every cluster in a sweep shares one run.
  const head = clusters[0] ?? null;
  const suiteSlug = head?.suiteSlug ?? "checkout-extraction";
  const runId = head?.runId ?? null;
  const exportedAt = head ? utcClock(head.createdAt) : "—";

  const requested = params.cluster;
  const initialClusterId =
    typeof requested === "string" ? Number.parseInt(requested, 10) : null;

  return (
    <ErrorWorkbenchView
      summary={summary}
      clusters={clusters}
      suiteSlug={suiteSlug}
      runId={runId}
      exportedAt={exportedAt}
      initialClusterId={
        initialClusterId !== null && !Number.isNaN(initialClusterId)
          ? initialClusterId
          : null
      }
    />
  );
}
