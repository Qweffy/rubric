import { notFound } from "next/navigation";

import { RunDetailView } from "@/components/run-detail/run-detail-view";
import { getRunDetail } from "@/lib/queries/runs";

// A run's matrix, per-scorer pass-rates and verdict reflect live pipeline
// state (a re-run mutates every cell); never statically cache this report.
export const dynamic = "force-dynamic";

interface RunDetailPageProps {
  params: Promise<{ suiteId: string; runId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RunDetailPage({ params, searchParams }: RunDetailPageProps) {
  const [{ runId: runIdRaw }] = await Promise.all([params, searchParams]);

  const runId = Number(runIdRaw);
  if (!Number.isInteger(runId) || runId <= 0) notFound();

  const detail = await getRunDetail(runId);
  if (detail === null) notFound();

  return <RunDetailView detail={detail} />;
}
