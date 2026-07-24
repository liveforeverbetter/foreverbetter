// Request and response examples for the generated OpenAPI document.
//
// The spec in schemas.ts is hand-built, so examples are attached by a
// post-processing pass (attachExamples) rather than living next to each schema:
//   - requestExamples is keyed by "METHOD /path" exactly as the path appears in
//     the OpenAPI paths object (with {id}/{user_id}/{provider} placeholders).
//   - responseExamples is keyed by the component schema name a response $refs.
//
// Keep these realistic and internally consistent (same user_id, org_id, source
// and analysis IDs throughout) so the rendered "try it" payloads read as one
// coherent walkthrough.

const USER_ID = 'usr_9f2c8a7b6d5e4f3a2b1c0d9e8f7a6b5c';
const ORG_ID = 'org_personal_9f2c8a7b6d5e4f3a2b1c0d9e8f7a6b5c';
const ANALYSIS_ID = 'an_7d1e9c4b2a3f';
const GEN_SOURCE = 'src_gen_2c8d1a';
const BIO_SOURCE = 'src_bio_5f3a90';
const WEAR_SOURCE = 'src_wear_9a1b7c';
const GENERATED_AT = '2026-07-24T09:15:00.000Z';

// A genetics finding showing the curated trait evidence surfaced per finding:
// analyzed genes, rsIDs, risk-loci count, heritability, health domain, plain
// consumer copy, and primary-study citations.
const geneticInterpretation = {
  id: 'int_rhr_9c2a',
  user_id: USER_ID,
  organization_id: ORG_ID,
  analysis_id: ANALYSIS_ID,
  category: 'genetics',
  type: 'polygenic_score',
  title: 'Resting heart rate',
  status: 'reference_relative',
  score: 62,
  summary: 'Your inherited baseline for resting heart rate sits around the population average. Your measured wearable value is the number to act on.',
  action: 'Track resting heart rate from your wearable and retest after eight weeks of Zone 2 training.',
  provenance: {
    source_ids: [GEN_SOURCE],
    source_categories: ['genetics'],
    source_type: 'direct',
    engine: 'genetics-polygenic-v2',
    generated_at: GENERATED_AT,
  },
  raw: {
    domain: 'cardiovascular',
    genes: ['GJA1', 'MYH6', 'SCN10A', 'CCDC141', 'RNF220'],
    rsids: ['rs272564', 'rs12110693', 'rs6801957', 'rs17287293'],
    risk_loci: 74,
    heritability_pct: 32,
    consumer_value: 'About a third of resting heart rate is inherited; the rest responds to aerobic fitness, sleep, and recovery. Use your measured value as the signal and this as the baseline it moves around.',
    references: [
      'Eppinga RN, et al. Nat Genet. 2016;48(12):1557-1563.',
      'den Hoed M, et al. Nat Genet. 2013;45(6):621-631.',
    ],
  },
};

const biomarkerInterpretation = {
  id: 'int_apob_4d7e',
  user_id: USER_ID,
  organization_id: ORG_ID,
  analysis_id: ANALYSIS_ID,
  category: 'biomarkers',
  type: 'lipids',
  title: 'ApoB',
  status: 'above_range',
  score: 108,
  summary: 'ApoB of 108 mg/dL is above the optimal range for long-term cardiovascular risk.',
  action: 'Discuss lipid-lowering options with your clinician and retest in twelve weeks.',
  provenance: {
    source_ids: [BIO_SOURCE],
    source_categories: ['biomarkers'],
    source_type: 'direct',
    engine: 'biomarkers-reference-v3',
    generated_at: GENERATED_AT,
  },
  raw: { value: 108, unit: 'mg/dL', reference_low: 40, reference_high: 90 },
};

const analysisResult = {
  id: ANALYSIS_ID,
  user_id: USER_ID,
  organization_id: ORG_ID,
  modality: 'multimodal',
  operation: 'analyze',
  created_at: GENERATED_AT,
  source_ids: [GEN_SOURCE, BIO_SOURCE, WEAR_SOURCE],
  raw_source_references: [
    {
      id: BIO_SOURCE,
      user_id: USER_ID,
      organization_id: ORG_ID,
      category: 'biomarkers',
      filename: 'panel-2026-07.pdf',
      content_type: 'application/pdf',
      received_at: GENERATED_AT,
      byte_length: 48213,
      storage_mode: 'durable',
      upload_status: 'complete',
    },
  ],
  normalized_observations: [
    {
      id: 'obs_apob_1',
      user_id: USER_ID,
      organization_id: ORG_ID,
      source_id: BIO_SOURCE,
      category: 'biomarkers',
      type: 'lipids',
      name: 'apob',
      value: 108,
      unit: 'mg/dL',
      observed_at: GENERATED_AT,
    },
    {
      id: 'obs_rhr_1',
      user_id: USER_ID,
      organization_id: ORG_ID,
      source_id: WEAR_SOURCE,
      category: 'wearables',
      type: 'cardiovascular',
      name: 'resting_heart_rate',
      value: 58,
      unit: 'bpm',
      observed_at: GENERATED_AT,
      provider: 'whoop',
    },
  ],
  derived_interpretations: [geneticInterpretation, biomarkerInterpretation],
  healthspan_score: 78,
  domain_scores: { cardiovascular: 74, metabolic: 81 },
};

const crossModality = [
  {
    signal: 'resting_heart_rate',
    domain: 'cardiovascular',
    measured: { value: 58, unit: 'bpm', modality: 'wearables', source_id: WEAR_SOURCE, observed_at: GENERATED_AT },
    genetic: { heritability_pct: 32, trait: 'Resting heart rate', finding_id: 'int_rhr_9c2a' },
    reading: 'Your measured resting heart rate is 58 bpm, the number to act on. Genetics explains about 32% of the baseline for this trait.',
  },
];

const healthContext = {
  user_id: USER_ID,
  organization_id: ORG_ID,
  generated_at: GENERATED_AT,
  latest_analysis_id: ANALYSIS_ID,
  coverage: [
    { modality: 'genetics', present: true, source_count: 1 },
    { modality: 'biomarkers', present: true, source_count: 1 },
    { modality: 'wearables', present: true, source_count: 1 },
  ],
  counts: { genetics: 41, biomarkers: 22, wearables: 6 },
  priority_findings: [
    { title: 'ApoB above range', category: 'biomarkers', priority: 'high' },
    { title: 'Resting heart rate baseline', category: 'genetics', priority: 'info' },
  ],
  modality_contexts: {
    cardiovascular: { measured: ['apob', 'resting_heart_rate'], genetic: ['resting_heart_rate'] },
  },
  cross_modality: crossModality,
  data_gaps: [{ modality: 'biomarkers', marker: 'lp(a)', reason: 'not_measured' }],
  provenance: { analysis_ids: [ANALYSIS_ID], storage_mode: 'durable' },
};

export const requestExamples: Record<string, unknown> = {
  'POST /billing/checkout': { tier: 'standard', organization_id: ORG_ID, activation_source: 'request_limit' },
  'POST /billing/portal': { organization_id: ORG_ID },
  'POST /auth/otp/start': { email: 'you@example.com' },
  'POST /auth/otp/verify': { email: 'you@example.com', token: '48213705' },
  'POST /agent-login/start': { agent_name: 'Longevity Copilot' },
  'POST /agent-login/confirm': { session_code: 'AGL-7F3K-92QD', access_token: 'eyJhbGciOiJI...', decision: 'approve' },
  'POST /api-keys': {
    name: 'Personal agent key',
    user_id: USER_ID,
    organization_id: ORG_ID,
    tier: 'free',
    intended_use: 'personal_agent',
  },
  'POST /imports/file': {
    user_id: USER_ID,
    organization_id: ORG_ID,
    category: 'biomarkers',
    filename: 'panel-2026-07.csv',
    content_type: 'text/csv',
    text: 'marker,value,unit\napob,108,mg/dL\nhscrp,0.8,mg/L\n',
  },
  'POST /genetics/uploads': {
    user_id: USER_ID,
    organization_id: ORG_ID,
    filename: 'genome.vcf.gz',
    byte_length: 734003200,
    content_type: 'application/gzip',
  },
  'POST /genetics/uploads/{id}/complete': { user_id: USER_ID, organization_id: ORG_ID },
  'POST /connections/wearables/start': {
    user_id: USER_ID,
    organization_id: ORG_ID,
    source_provider: 'whoop',
  },
  'POST /connections/wearables/callback': {
    user_id: USER_ID,
    organization_id: ORG_ID,
    source_provider: 'whoop',
    code: 'oauth_authorization_code',
  },
  'POST /connections/{provider}/auth-url': {
    provider: 'whoop',
    client_id: 'your_whoop_client_id',
    redirect_uri: 'https://your-app.example.com/callback',
    scopes: ['read:recovery', 'read:cycles', 'read:sleep'],
  },
  'POST /connections/{provider}/token': {
    code: 'oauth_authorization_code',
    client_id: 'your_whoop_client_id',
    client_secret: 'your_whoop_client_secret',
    redirect_uri: 'https://your-app.example.com/callback',
  },
  'POST /connections/{provider}/refresh': {
    refresh_token: 'your_refresh_token',
    client_id: 'your_whoop_client_id',
    client_secret: 'your_whoop_client_secret',
  },
  'POST /api/v1/sdk/users/{user_id}/sync': {
    provider: 'health_connect',
    sdkVersion: '1.4.0',
    syncTimestamp: GENERATED_AT,
    data: {
      records: [{ type: 'steps', count: 8214, startTime: '2026-07-23T00:00:00.000Z', endTime: '2026-07-23T23:59:59.000Z' }],
      sleep: [{ startTime: '2026-07-23T23:10:00.000Z', endTime: '2026-07-24T06:55:00.000Z', stages: [] }],
      workouts: [],
    },
  },
  'POST /analyses': {
    user_id: USER_ID,
    organization_id: ORG_ID,
    source_ids: [GEN_SOURCE, BIO_SOURCE, WEAR_SOURCE],
    annotation_depth: 'compact',
    profile: { age: 41, sex: 'male' },
  },
  'POST /analyses/{id}/rerun': {},
  'POST /biomarkers/derive': { user_id: USER_ID, organization_id: ORG_ID, source_ids: [BIO_SOURCE] },
  'POST /biomarkers/analyze': { user_id: USER_ID, organization_id: ORG_ID, source_ids: [BIO_SOURCE] },
  'POST /wearables/analyze': { user_id: USER_ID, organization_id: ORG_ID, source_ids: [WEAR_SOURCE] },
  'POST /genetics/analyze': { user_id: USER_ID, organization_id: ORG_ID, source_ids: [GEN_SOURCE], annotation_depth: 'compact' },
  'POST /genetics/ancestry': { user_id: USER_ID, organization_id: ORG_ID, source_id: GEN_SOURCE, resolution: 'regional' },
  'POST /dashboard-links': { analysis_id: ANALYSIS_ID, design_id: 'aperture', expires_in_days: 30 },
  'POST /users/{user_id}/health-context': { organization_id: ORG_ID, max_findings: 20 },
  'POST /users/{user_id}/trends': { organization_id: ORG_ID, markers: ['apob', 'resting_heart_rate'], window_days: 180 },
  'POST /users/{user_id}/goals': {
    organization_id: ORG_ID,
    title: 'Lower ApoB to optimal',
    metric: 'apob',
    target_value: 80,
    target_unit: 'mg/dL',
    target_direction: 'decrease',
    due_date: '2026-12-31',
  },
  'POST /goals/{id}': { status: 'achieved', note: 'Retest confirmed ApoB at 79 mg/dL.' },
  'POST /query': { user_id: USER_ID, organization_id: ORG_ID, query: 'How does my genetic resting heart rate compare to my measured value?' },
  'POST /users/{user_id}/data/export': { organization_id: ORG_ID },
  'POST /users/{user_id}/data/delete': { organization_id: ORG_ID },
};

const dashboardSpec = {
  schema_version: '1.0',
  id: 'dash_7d1e9c',
  user_id: USER_ID,
  organization_id: ORG_ID,
  analysis_id: ANALYSIS_ID,
  generated_at: GENERATED_AT,
  cards: [
    {
      id: 'card_apob',
      title: 'ApoB',
      category: 'cardiovascular',
      status: 'above_range',
      summary: 'ApoB of 108 mg/dL is above the optimal range.',
      value: 108,
      unit: 'mg/dL',
      target: { min: 40, max: 90 },
      visualization: 'range',
      confidence: 'high',
      provenance: {
        source_ids: [BIO_SOURCE],
        source_categories: ['biomarkers'],
        source_type: 'direct',
        engine: 'biomarkers-reference-v3',
        generated_at: GENERATED_AT,
      },
    },
  ],
  coverage: [
    { modality: 'biomarkers', present: true, source_count: 1, finding_count: 22 },
    { modality: 'genetics', present: true, source_count: 1, finding_count: 41 },
  ],
  quality: {
    status: 'complete',
    usable: true,
    warnings: [],
    freshness: [{ modality: 'biomarkers', status: 'fresh', threshold_days: 180, latest_received_at: GENERATED_AT, age_days: 0 }],
  },
  sections: [{ id: 'sec_cardio', title: 'Cardiovascular', category: 'cardiovascular', card_ids: ['card_apob'] }],
  provenance: { source_ids: [GEN_SOURCE, BIO_SOURCE, WEAR_SOURCE], storage_mode: 'durable', clinical_boundary: 'Informational only. Not a diagnosis.' },
};

export const responseExamples: Record<string, unknown> = {
  DashboardSpec: dashboardSpec,
  ProblemDetails: {
    type: 'https://wellnizz.com/problems/forbidden',
    title: 'Forbidden',
    status: 403,
    detail: 'This API key is not permitted to call this endpoint.',
    request_id: 'req_5f3a90c2',
  },
  SourceImportResult: {
    source: {
      id: BIO_SOURCE,
      user_id: USER_ID,
      organization_id: ORG_ID,
      category: 'biomarkers',
      filename: 'panel-2026-07.csv',
      content_type: 'text/csv',
      received_at: GENERATED_AT,
      byte_length: 512,
      storage_mode: 'durable',
      upload_status: 'complete',
    },
    normalized_observations: analysisResult.normalized_observations.slice(0, 1),
    warnings: [],
  },
  SourceList: {
    sources: [analysisResult.raw_source_references[0]],
    count: 1,
    total: 3,
  },
  SourceDetail: {
    source: analysisResult.raw_source_references[0],
    normalized_observations: analysisResult.normalized_observations.slice(0, 1),
  },
  WebhookEventList: {
    events: [
      { id: 'evt_9a1b', type: 'analysis.completed', data: { analysis_id: ANALYSIS_ID }, created_at: GENERATED_AT },
    ],
  },
  AnalysisList: {
    analyses: [{ id: ANALYSIS_ID, created_at: GENERATED_AT, source_ids: [GEN_SOURCE, BIO_SOURCE, WEAR_SOURCE], interpretation_count: 63 }],
    count: 1,
    total: 1,
  },
  AnalysisResult: analysisResult,
  RecommendationsResult: {
    analysis_id: ANALYSIS_ID,
    user_id: USER_ID,
    organization_id: ORG_ID,
    generated_at: GENERATED_AT,
    healthspan_score: 78,
    count: 1,
    recommendations: [
      {
        title: 'Lower ApoB toward optimal',
        category: 'cardiovascular',
        priority: 'high',
        rationale: 'ApoB of 108 mg/dL is above the optimal range for long-term risk.',
        action: 'Discuss lipid management with your clinician; retest in twelve weeks.',
        provenance: { analysis_id: ANALYSIS_ID, source_ids: [BIO_SOURCE], engine: 'recommendations-v2' },
      },
    ],
    protocols: [
      { id: 'core', name: 'Core protocol', focus: 'Cardiovascular risk', domains: ['cardiovascular'], items: [] },
    ],
  },
  ActionPlan: {
    analysis_id: ANALYSIS_ID,
    user_id: USER_ID,
    organization_id: ORG_ID,
    generated_at: GENERATED_AT,
    status: 'ready',
    summary: 'Two core interventions target your above-range ApoB and support your cardiovascular baseline.',
    interventions: [
      { title: 'Increase soluble fiber to 10 g/day', cadence: 'Today', evidence_grade: 'B', rationale: 'Lowers ApoB-bearing lipoproteins.' },
    ],
    supplements: [
      { name: 'Omega-3 (EPA/DHA)', dose: '2 g/day', evidence_grade: 'B', already_taking: false },
    ],
    cautions: ['Do not change prescribed medications without your clinician.'],
    evidence_key: { A: 'Consistent RCT evidence', B: 'Limited or mixed RCT evidence' },
    sources: [{ title: 'Eppinga RN, et al. Nat Genet. 2016.', url: 'https://doi.org/10.1038/ng.3708' }],
    disclaimer: 'This is not medical advice. Confirm any change with a qualified clinician.',
    provenance: { analysis_id: ANALYSIS_ID, engine: 'action-plan-v3' },
  },
  AncestryResult: {
    schema_version: '1.0',
    id: 'anc_3f7a',
    user_id: USER_ID,
    organization_id: ORG_ID,
    source_id: GEN_SOURCE,
    status: 'complete',
    reference_panel: '1000_genomes_phase3',
    proportion_unit: 'percent',
    method: { id: 'curated_aim_maximum_likelihood', version: '1.0', execution: 'synchronous' },
    resolution: 'regional',
    summary: 'Predominantly Northwestern European with a Southern European component.',
    ancestry: [
      { region: 'Europe', sub_region: 'Northwestern Europe', proportion: 78.4, confidence: 'high' },
      { region: 'Europe', sub_region: 'Southern Europe', proportion: 21.6, confidence: 'medium' },
    ],
    haplogroups: { maternal: { haplogroup: 'H1' }, paternal: { haplogroup: 'R-M269' } },
    quality: { variant_count: 640000, marker_count: 4500, matched_markers: 4380, matched_proportion: 97.3, compatible_for_projection: true, notes: [] },
    methodology: {
      algorithm: 'Maximum-likelihood projection onto curated ancestry-informative markers.',
      reference_panel: '1000 Genomes Phase 3',
      reference_populations: 'Five super-populations with regional subpanels.',
      marker_source: 'Curated ancestry-informative markers.',
      limitations: ['Genetic ancestry is not identity, ethnicity, or nationality.'],
    },
    generated_at: GENERATED_AT,
  },
  GeneticJob: {
    id: 'job_2c8d',
    analysis_id: ANALYSIS_ID,
    source_id: GEN_SOURCE,
    user_id: USER_ID,
    status: 'running',
    attempts: 1,
    max_attempts: 3,
    created_at: GENERATED_AT,
    updated_at: GENERATED_AT,
  },
  DashboardLinkResult: {
    dashboard_url: 'https://app.wellnizz.com/dashboards/private/eyJhbGciOiJIUzI1NiJ9.abc123',
    analysis_id: ANALYSIS_ID,
    design: { id: 'aperture', name: 'Aperture', layout: {} },
    visibility: 'private_by_possession',
    expires_at: '2026-08-23T09:15:00.000Z',
    sharing: { default: 'private', optional: true, note: 'Anyone with this link can view the dashboard until it expires.' },
  },
  HealthContext: healthContext,
  TrendsResult: {
    user_id: USER_ID,
    organization_id: ORG_ID,
    generated_at: GENERATED_AT,
    window_days: 180,
    marker_count: 2,
    improving: 1,
    worsening: 0,
    stable: 1,
    markers: [
      {
        marker: 'apob',
        name: 'ApoB',
        modality: 'biomarkers',
        trend: 'improving',
        first: 121,
        latest: 108,
        points: [
          { value: 121, observed_at: '2026-01-20T09:00:00.000Z', source_id: 'src_bio_old' },
          { value: 108, observed_at: GENERATED_AT, source_id: BIO_SOURCE },
        ],
      },
    ],
  },
  RetestReminderList: {
    user_id: USER_ID,
    organization_id: ORG_ID,
    generated_at: GENERATED_AT,
    reminders: [
      { category: 'biomarkers', metric: 'apob', last_observed_at: GENERATED_AT, cadence_days: 90, next_due_at: '2026-10-22T09:15:00.000Z', days_until_due: 90, status: 'ok', reason: 'Retested recently; next draw in about three months.' },
    ],
  },
  Goal: {
    id: 'goal_4d7e',
    user_id: USER_ID,
    organization_id: ORG_ID,
    title: 'Lower ApoB to optimal',
    metric: 'apob',
    target_value: 80,
    target_unit: 'mg/dL',
    target_direction: 'decrease',
    due_date: '2026-12-31',
    status: 'active',
    created_at: GENERATED_AT,
    updated_at: GENERATED_AT,
  },
  GoalList: {
    goals: [
      {
        id: 'goal_4d7e',
        user_id: USER_ID,
        organization_id: ORG_ID,
        title: 'Lower ApoB to optimal',
        metric: 'apob',
        target_value: 80,
        target_unit: 'mg/dL',
        target_direction: 'decrease',
        due_date: '2026-12-31',
        status: 'active',
        created_at: GENERATED_AT,
        updated_at: GENERATED_AT,
      },
    ],
  },
  QueryResult: {
    query: 'How does my genetic resting heart rate compare to my measured value?',
    matches: [geneticInterpretation],
  },
};
