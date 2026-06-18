import { JudgeCalibrationView } from "@/components/judges/judge-calibration-view";
import { getCalibration } from "@/lib/queries/calibration";


// Read fresh on every request — the seeded SQLite store is the source of truth
// and calibration runs / human labels can change between visits.
export const dynamic = "force-dynamic";

/** The canonical default judge surfaced when no ?judge= is given. */
const DEFAULT_JUDGE = "claude-opus-4";

interface JudgesPageProps {
  // Next 16: params and searchParams are Promises that must be awaited.
  params: Promise<Record<string, never>>;
  searchParams: Promise<{ judge?: string }>;
}

/**
 * Judge Calibration (M2) — "the calibration bench: can I trust this judge?".
 * Server Component: awaits the route inputs, loads one judge's calibration
 * profile (Cohen κ, raw agreement, the TP/TN/FP/FN confusion matrix, position
 * and length bias, and the concrete judge↔human disagreements), and hands the
 * typed result to the client view that renders the screen. The optional ?judge=
 * search param selects which judge to inspect; it defaults to the seeded
 * default judge (claude-opus-4).
 */
export default async function JudgesPage({
  params,
  searchParams,
}: JudgesPageProps) {
  await params;
  const { judge } = await searchParams;
  const judgeName = judge ?? DEFAULT_JUDGE;

  const calibration = await getCalibration(judgeName);

  return (
    <JudgeCalibrationView
      calibration={calibration}
      requestedJudge={judgeName}
    />
  );
}
