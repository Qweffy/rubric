import { notFound } from "next/navigation";

import { CaseDetailView } from "@/components/case-detail/case-detail-view";
import { CaseNotFoundView } from "@/components/case-detail/case-not-found-view";
import { getCaseDetail } from "@/lib/queries/cases";

// A case reflects live run state — verdicts, judge tokens, and human labels land
// via background sweeps. Never statically cache it.
export const dynamic = "force-dynamic";

interface CaseDetailPageProps {
  // Next 16: params and searchParams are Promises that must be awaited.
  params: Promise<{ suiteId: string; runId: string; caseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Read a single-valued search param, ignoring repeated keys. */
function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function CaseDetailPage({
  params,
  searchParams,
}: CaseDetailPageProps) {
  const [{ suiteId, runId, caseId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  // The route's [caseId] segment carries the case_results row id (the unique
  // per-run row), which is the key getCaseDetail is documented to accept. A
  // non-numeric segment can never resolve, so it is a 404.
  const caseRowId = Number(caseId);
  if (!Number.isInteger(caseRowId) || caseRowId <= 0) {
    notFound();
  }

  const detail = await getCaseDetail(caseRowId);
  if (detail === null) {
    return <CaseNotFoundView suiteId={suiteId} runId={runId} />;
  }

  // Human gold label drives the judge-disagrees + awaiting-human panel states.
  // `?human=pass|fail` reflects a recorded label; `?human=pending` surfaces the
  // awaiting-review affordance. Absent means no label exists yet (quiet panel).
  const humanRaw = readParam(query, "human");
  const awaitingHuman = humanRaw === "pending";
  const humanLabel =
    humanRaw === "pass" || humanRaw === "fail" ? humanRaw : null;

  return (
    <CaseDetailView
      detail={detail}
      suiteId={suiteId}
      runId={runId}
      humanLabel={humanLabel}
      awaitingHuman={awaitingHuman}
    />
  );
}
