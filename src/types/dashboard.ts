export type MetricTone = "brand" | "neutral" | "warning";
export type AccessStatus = "Liberado" | "Em analise" | "Restrito";
export type Priority = "Alta" | "Media" | "Baixa";
export type StudentStage =
  | "Onboarding"
  | "Treinamento"
  | "Avaliacao"
  | "Simulador"
  | "Mesa real";

export type CompanySnapshot = {
  name: string;
  vertical: string;
  website: string;
  environment: string;
  deploymentTarget: string;
};

export type DashboardKpi = {
  label: string;
  value: string;
  trend: string;
  hint: string;
  tone: MetricTone;
};

export type StudentRecord = {
  id: string;
  name: string;
  email: string;
  plan: string;
  stage: StudentStage;
  accessStatus: AccessStatus;
  mentor: string;
  updatedAt: string;
};

export type EnrollmentSummary = {
  label: string;
  total: number;
  description: string;
};

export type PlanSnapshot = {
  name: string;
  activeStudents: number;
  revenueShare: string;
  maxContracts: string;
  highlight: string;
};

export type AccessModule = {
  name: string;
  active: number;
  pending: number;
  blocked: number;
  description: string;
};

export type PendingAction = {
  title: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  context: string;
};

export type ActivityItem = {
  title: string;
  type: string;
  time: string;
  note: string;
};

export type DashboardOverview = {
  company: CompanySnapshot;
  kpis: DashboardKpi[];
  guruMetrics: DashboardKpi[];
  students: StudentRecord[];
  enrollments: EnrollmentSummary[];
  plans: PlanSnapshot[];
  accessModules: AccessModule[];
  pendingActions: PendingAction[];
  activityTimeline: ActivityItem[];
};
