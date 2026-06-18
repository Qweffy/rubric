import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { errorClusters, runs, suites } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Error clusters — grouped failures surfaced in the Error Workbench.   */
/* Each cluster names a failure mode, its size, the scorer that drove   */
/* it, the traits the members share, and whether it's been promoted     */
/* into the regression golden set.                                      */
/* ------------------------------------------------------------------ */

export interface ErrorClusterRow {
  id: number;
  name: string;
  size: number;
  /** The scorer most responsible for the cluster's failures. */
  dominantScorer: string;
  /** Free-text failure mode label ("schema-violation", "hallucinated-field"). */
  mode: string;
  sharedTraits: string[];
  /** Logical case ids belonging to the cluster. */
  caseIds: string[];
  /** True once the cluster has been promoted into the regression golden set. */
  inGoldenSet: boolean;
  createdAt: Date;
  /** Owning run + suite context for the workbench header. */
  runId: number;
  sha: string;
  suiteSlug: string;
  suiteTitle: string;
}

export interface ErrorClustersSummary {
  clusterCount: number;
  /** Total cases across all clusters (sum of size). */
  affectedCases: number;
  /** Clusters already promoted into the golden set. */
  promotedCount: number;
}

export interface ErrorClustersData {
  summary: ErrorClustersSummary;
  clusters: ErrorClusterRow[];
}

/**
 * Error clusters across runs, largest-first, for the Error Workbench. Each
 * cluster carries its owning run/suite so the workbench can deep-link back to
 * the offending cases. A summary strip tops the list.
 */
export async function getErrorClusters(): Promise<ErrorClustersData> {
  const clusters = await db
    .select({
      id: errorClusters.id,
      name: errorClusters.name,
      size: errorClusters.size,
      dominantScorer: errorClusters.dominantScorer,
      mode: errorClusters.mode,
      sharedTraits: errorClusters.sharedTraits,
      caseIds: errorClusters.caseIds,
      inGoldenSet: errorClusters.inGoldenSet,
      createdAt: errorClusters.createdAt,
      runId: errorClusters.runId,
      sha: runs.sha,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
    })
    .from(errorClusters)
    .innerJoin(runs, eq(runs.id, errorClusters.runId))
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .orderBy(desc(errorClusters.size));

  const summary: ErrorClustersSummary = {
    clusterCount: clusters.length,
    affectedCases: clusters.reduce((a, c) => a + c.size, 0),
    promotedCount: clusters.filter((c) => c.inGoldenSet).length,
  };

  return { summary, clusters };
}
