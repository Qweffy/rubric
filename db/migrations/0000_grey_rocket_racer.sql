CREATE TABLE `calibration_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`suite_id` integer NOT NULL,
	`judge_id` integer NOT NULL,
	`n` integer NOT NULL,
	`tp` integer NOT NULL,
	`tn` integer NOT NULL,
	`fp` integer NOT NULL,
	`fn` integer NOT NULL,
	`kappa` real NOT NULL,
	`agreement` real NOT NULL,
	`pos_bias` real,
	`length_bias` real,
	`length_r2` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`suite_id`) REFERENCES `suites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`judge_id`) REFERENCES `judges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `calibration_runs_suite_idx` ON `calibration_runs` (`suite_id`);--> statement-breakpoint
CREATE INDEX `calibration_runs_judge_idx` ON `calibration_runs` (`judge_id`);--> statement-breakpoint
CREATE TABLE `case_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_row_id` integer NOT NULL,
	`scorer_name` text NOT NULL,
	`pass` integer NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`detail` text,
	`errors` text NOT NULL,
	`latency_ms` integer,
	`flipped_from` text,
	FOREIGN KEY (`case_row_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_results_case_scorer_unique` ON `case_results` (`case_row_id`,`scorer_name`);--> statement-breakpoint
CREATE TABLE `cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`case_id` text NOT NULL,
	`label` text,
	`input` text NOT NULL,
	`expected` text NOT NULL,
	`actual` text,
	`verdict` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`precondition` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cases_run_case_unique` ON `cases` (`run_id`,`case_id`);--> statement-breakpoint
CREATE TABLE `error_clusters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`dominant_scorer` text NOT NULL,
	`mode` text NOT NULL,
	`shared_traits` text NOT NULL,
	`case_ids` text NOT NULL,
	`in_golden_set` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `error_clusters_run_idx` ON `error_clusters` (`run_id`);--> statement-breakpoint
CREATE TABLE `human_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`suite_id` integer NOT NULL,
	`case_id` text NOT NULL,
	`label` text NOT NULL,
	`labeled_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`suite_id`) REFERENCES `suites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `human_labels_suite_case_unique` ON `human_labels` (`suite_id`,`case_id`);--> statement-breakpoint
CREATE TABLE `judge_verdicts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_row_id` integer NOT NULL,
	`judge_id` integer NOT NULL,
	`score` integer NOT NULL,
	`pass` integer NOT NULL,
	`rubric_results` text NOT NULL,
	`reasoning` text,
	`tokens` integer,
	`cost_usd` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_row_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`judge_id`) REFERENCES `judges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `judge_verdicts_case_idx` ON `judge_verdicts` (`case_row_id`);--> statement-breakpoint
CREATE INDEX `judge_verdicts_judge_idx` ON `judge_verdicts` (`judge_id`);--> statement-breakpoint
CREATE TABLE `judges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`kappa` real,
	`agreement` real,
	`false_pass` integer,
	`false_fail` integer,
	`pos_bias` real,
	`length_bias` real,
	`cost_per_1k` real,
	`latency_p50_ms` integer,
	`status` text DEFAULT 'under-calibrated' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `judges_name_unique` ON `judges` (`name`);--> statement-breakpoint
CREATE TABLE `prompt_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`suite_id` integer NOT NULL,
	`label` text NOT NULL,
	`ref` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`suite_id`) REFERENCES `suites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_versions_suite_label_unique` ON `prompt_versions` (`suite_id`,`label`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`suite_id` integer NOT NULL,
	`prompt_version_id` integer NOT NULL,
	`sha` text NOT NULL,
	`branch` text NOT NULL,
	`trigger` text DEFAULT 'manual' NOT NULL,
	`triggered_by` text,
	`status` text DEFAULT 'running' NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`pass_count` integer DEFAULT 0 NOT NULL,
	`fail_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`pass_rate` real DEFAULT 0 NOT NULL,
	`cost_usd` real DEFAULT 0 NOT NULL,
	`wall_ms` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`suite_id`) REFERENCES `suites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `runs_suite_started_idx` ON `runs` (`suite_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `runs_prompt_version_idx` ON `runs` (`prompt_version_id`);--> statement-breakpoint
CREATE TABLE `suites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`repo` text NOT NULL,
	`status` text DEFAULT 'passing' NOT NULL,
	`latest_run_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suites_slug_unique` ON `suites` (`slug`);--> statement-breakpoint
CREATE TABLE `trajectory_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`idx` integer NOT NULL,
	`expected_tool` text,
	`actual_tool` text,
	`args` text NOT NULL,
	`result` text NOT NULL,
	`match` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `trajectory_tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trajectory_steps_task_idx_unique` ON `trajectory_steps` (`task_id`,`idx`);--> statement-breakpoint
CREATE TABLE `trajectory_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`suite_id` integer NOT NULL,
	`run_id` integer,
	`task_id` text NOT NULL,
	`expected_tools` text NOT NULL,
	`tool_selection_accuracy` real NOT NULL,
	`final_answer_pass` integer NOT NULL,
	`outcome` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`suite_id`) REFERENCES `suites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `trajectory_tasks_suite_idx` ON `trajectory_tasks` (`suite_id`);--> statement-breakpoint
CREATE INDEX `trajectory_tasks_run_idx` ON `trajectory_tasks` (`run_id`);