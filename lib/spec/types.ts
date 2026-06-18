import { type z } from "zod";

import {
  type caseSpecSchema,
  type containsScorerSchema,
  type exactMatchScorerSchema,
  type execTargetSchema,
  type fieldAccuracyScorerSchema,
  type fixtureTargetSchema,
  type jsonSchemaScorerSchema,
  type judgeScorerSchema,
  type promptSpecSchema,
  type scorerSpecSchema,
  type suiteSpecSchema,
  type targetSpecSchema,
} from "@/lib/spec/schema";

export type PromptSpec = z.infer<typeof promptSpecSchema>;

export type FixtureTarget = z.infer<typeof fixtureTargetSchema>;
export type ExecTarget = z.infer<typeof execTargetSchema>;
export type TargetSpec = z.infer<typeof targetSpecSchema>;

export type ExactMatchScorer = z.infer<typeof exactMatchScorerSchema>;
export type JsonSchemaScorer = z.infer<typeof jsonSchemaScorerSchema>;
export type FieldAccuracyScorer = z.infer<typeof fieldAccuracyScorerSchema>;
export type ContainsScorer = z.infer<typeof containsScorerSchema>;
export type JudgeScorer = z.infer<typeof judgeScorerSchema>;
export type ScorerSpec = z.infer<typeof scorerSpecSchema>;

export type CaseSpec = z.infer<typeof caseSpecSchema>;

export type SuiteSpec = z.infer<typeof suiteSpecSchema>;
