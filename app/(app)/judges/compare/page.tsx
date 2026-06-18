import { ModelComparisonView } from "@/components/model-comparison/model-comparison-view";
import { getModelComparison } from "@/lib/queries/calibration";

// The judge board reflects the latest calibration of every judge against the
// shared human-gold set; calibration lands out-of-band, so never statically
// cache it — read per request.
export const dynamic = "force-dynamic";

/**
 * Judge Comparison (M2) — the accuracy-per-cost bench. Server component: awaits
 * the per-judge comparison rows (κ / agreement / cost / bias vs the human gold
 * labels) from the server-only data layer, then hands a typed snapshot to the
 * client view that renders the table, inter-judge matrix and cost-vs-accuracy
 * scatter. Next 16: params / searchParams are Promises and are awaited even
 * though this route reads neither, to keep the contract explicit.
 */
export default async function ModelComparisonPage({
  params,
  searchParams,
}: {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  await searchParams;

  const judges = await getModelComparison();

  return <ModelComparisonView judges={judges} />;
}
