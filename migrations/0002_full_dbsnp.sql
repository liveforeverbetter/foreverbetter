-- Persist the requested genetics annotation depth so queued workers execute the
-- same paid/explicit choice that the caller made at analysis creation time.
alter table if exists health_api.genetic_analysis_jobs
  add column if not exists annotation_depth text not null default 'compact';

alter table if exists health_api.genetic_analysis_jobs
  drop constraint if exists genetic_analysis_jobs_annotation_depth_check;

alter table if exists health_api.genetic_analysis_jobs
  add constraint genetic_analysis_jobs_annotation_depth_check
  check (annotation_depth in ('compact', 'full_dbsnp'));
