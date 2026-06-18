import { TrajectoryDetailView } from "@/components/trajectory-detail/trajectory-detail-view";
import { getTrajectoryDetail } from "@/lib/queries/trajectories";

export const dynamic = "force-dynamic";

interface TrajectoryDetailPageProps {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Rubric Trajectory Detail — the expected-vs-actual step trace for one agent
 * task. Server Component: awaits the route params (Next 16), loads the seeded
 * trajectory by its logical taskId, and hands the typed detail to the client
 * view. The `?step=` query selects which actual call the per-step drawer opens.
 */
export default async function TrajectoryDetailPage({
  params,
  searchParams,
}: TrajectoryDetailPageProps) {
  const { taskId } = await params;
  const query = await searchParams;
  const detail = await getTrajectoryDetail(taskId);

  const rawStep = query.step;
  const stepParam = Array.isArray(rawStep) ? rawStep[0] : rawStep;
  const parsedStep = stepParam ? Number.parseInt(stepParam, 10) : Number.NaN;
  const initialStepIdx = Number.isFinite(parsedStep) ? parsedStep : null;

  return (
    <TrajectoryDetailView
      taskId={taskId}
      detail={detail}
      initialStepIdx={initialStepIdx}
    />
  );
}
