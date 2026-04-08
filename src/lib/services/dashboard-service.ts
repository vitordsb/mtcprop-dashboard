import type {
  AccessStatus as DbAccessStatus,
  EnrollmentStatus,
  StudentStage as DbStudentStage,
} from "@prisma/client";
import { unstable_cache } from "next/cache";

import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type {
  AccessModule,
  ActivityItem,
  DashboardOverview,
  PendingAction,
  StudentRecord,
} from "@/types/dashboard";

const stageLabelMap: Record<DbStudentStage, StudentRecord["stage"]> = {
  ONBOARDING: "Onboarding",
  TRAINING: "Treinamento",
  EVALUATION: "Avaliacao",
  SIMULATOR: "Simulador",
  LIVE_DESK: "Mesa real",
};

const accessStatusMap: Record<DbAccessStatus, StudentRecord["accessStatus"]> = {
  ACTIVE: "Liberado",
  PENDING: "Em analise",
  BLOCKED: "Restrito",
  EXPIRED: "Restrito",
};

const moduleLabelMap: Record<string, string> = {
  "live-room": "Sala ao vivo",
  "training-library": "Biblioteca de aulas",
  "premium-community": "Comunidade premium",
  support: "Suporte operacional",
};

const moduleDescriptionMap: Record<string, string> = {
  "live-room": "Acesso para acompanhamento das operacoes e calls.",
  "training-library": "Treinamentos gravados, trilhas e materiais de apoio.",
  "premium-community": "Grupo fechado para alunos ativos e operadores elegiveis.",
  support: "Canal de atendimento para ativacao, reset e migracoes.",
};

const planHighlightMap: Record<string, string> = {
  "plano-start": "Entrada inicial para o trader validar consistencia.",
  "plano-intermediario": "Faixa mais recorrente na operacao da MTCprop.",
  "plano-avancado": "Plano com maior alavancagem operacional.",
  "plano-expert": "Perfil premium com maior capacidade de contratos.",
  "plano-intermediario-fast": "Fluxo rapido para traders com boa curva inicial.",
  "plano-avancado-fast": "Versao acelerada com gatilho de mesa real.",
  "plano-intermediario-fast-pro": "Formato fast com condicoes ampliadas.",
  "plano-avancado-fast-pro": "Faixa premium dos planos fast.",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeDate(date: Date) {
  const diffInMinutes = Math.max(
    1,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );

  if (diffInMinutes < 60) {
    return `Atualizado ha ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `Atualizado ha ${diffInHours} h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `Atualizado ha ${diffInDays} d`;
}

function prettifyModuleKey(moduleKey: string) {
  return moduleLabelMap[moduleKey] ?? moduleKey.replace(/-/g, " ");
}

function buildPendingActions(params: {
  pendingEnrollments: number;
  pendingAccess: number;
  onboardingStudents: number;
  liveDeskStudents: number;
}): PendingAction[] {
  const items: PendingAction[] = [];

  if (params.pendingAccess > 0) {
    items.push({
      title: "Liberar acessos pendentes",
      owner: "Suporte",
      dueDate: "Hoje",
      priority: "Alta",
      context: `${params.pendingAccess} acessos aguardam liberacao ou revisao manual.`,
    });
  }

  if (params.pendingEnrollments > 0) {
    items.push({
      title: "Revisar inscricoes em analise",
      owner: "Comercial",
      dueDate: "Hoje",
      priority: "Media",
      context: `${params.pendingEnrollments} inscricoes ainda nao foram ativadas na base.`,
    });
  }

  if (params.onboardingStudents > 0) {
    items.push({
      title: "Acompanhar onboarding inicial",
      owner: "Operacao",
      dueDate: "Esta semana",
      priority: "Media",
      context: `${params.onboardingStudents} alunos seguem na etapa inicial de ativacao.`,
    });
  }

  items.push({
    title: "Monitorar traders em mesa real",
    owner: "Analise",
    dueDate: "Continuo",
    priority: "Baixa",
    context: `${params.liveDeskStudents} traders estao hoje em conta real.`,
  });

  return items.slice(0, 4);
}

function buildActivityTimeline(params: {
  activeStudents: number;
  activeEnrollments: number;
  activeAccess: number;
  liveDeskStudents: number;
}): ActivityItem[] {
  return [
    {
      title: `${params.activeStudents} alunos ativos na base`,
      type: "Base",
      time: "Agora",
      note: "Contagem vinda diretamente do Postgres.",
    },
    {
      title: `${params.activeEnrollments} inscricoes ativas em andamento`,
      type: "Inscricoes",
      time: "Agora",
      note: "Panorama operacional consolidado no monolito Next.js.",
    },
    {
      title: `${params.activeAccess} acessos liberados`,
      type: "Permissoes",
      time: "Agora",
      note: "Total calculado pelos Access Grants ativos.",
    },
    {
      title: `${params.liveDeskStudents} traders em conta real`,
      type: "Mesa real",
      time: "Agora",
      note: "Dado consolidado a partir da planilha importada para o banco.",
    },
  ];
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    return getCachedDashboardOverview();
  },
};

const getCachedDashboardOverview = unstable_cache(
  async (): Promise<DashboardOverview> => {
    const [
      [baseStatsResult],
      stageCounts,
      enrollmentCounts,
      moduleCounts,
      productEnrollmentCounts,
      products,
      recentStudents,
    ] = await Promise.all([
      // 1. Raw query para todas as contagens base (apenas 1 ida ao BD em vez de 5)
      prisma.$queryRaw<
        Array<{
          activeStudents: bigint;
          activeEnrollments: bigint;
          pendingEnrollments: bigint;
          activeAccess: bigint;
          pendingAccess: bigint;
        }>
      >`
        SELECT 
          (SELECT COUNT(*) FROM "Student" WHERE "isActive" = true) AS "activeStudents",
          (SELECT COUNT(*) FROM "Enrollment" WHERE "status" = 'ACTIVE') AS "activeEnrollments",
          (SELECT COUNT(*) FROM "Enrollment" WHERE "status" = 'PENDING') AS "pendingEnrollments",
          (SELECT COUNT(*) FROM "AccessGrant" WHERE "status" = 'ACTIVE') AS "activeAccess",
          (SELECT COUNT(*) FROM "AccessGrant" WHERE "status" = 'PENDING') AS "pendingAccess"
      `,
      // 2. Query de agrupamento da etapa dos estudantes
      prisma.$queryRaw<Array<{ stage: DbStudentStage; count: bigint }>>`
        SELECT "stage", COUNT(*) as "count" 
        FROM "Student" 
        WHERE "isActive" = true 
        GROUP BY "stage"
      `,
      // 3. Status de todos os planos
      prisma.$queryRaw<Array<{ status: EnrollmentStatus; count: bigint }>>`
        SELECT "status", COUNT(*) as "count" 
        FROM "Enrollment" 
        GROUP BY "status"
      `,
      // 4. Modulos e seus respectivos status de acesso
      prisma.$queryRaw<Array<{ moduleKey: string; status: DbAccessStatus; count: bigint }>>`
        SELECT "moduleKey", "status", COUNT(*) as "count" 
        FROM "AccessGrant" 
        GROUP BY "moduleKey", "status"
      `,
      // 5. Total de alunos ativos por produto
      prisma.$queryRaw<Array<{ productId: string; count: bigint }>>`
        SELECT "productId", COUNT(*) as "count" 
        FROM "Enrollment" 
        WHERE "status" = 'ACTIVE' 
        GROUP BY "productId"
      `,
      // 6. Resgatar descricoes dos produtos (Tabela minúscula, Prisma ORM comum)
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          maxContracts: true,
        },
      }),
      // 7. Ultimos traders para o log recente
      prisma.student.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              product: true,
            },
          },
          accessGrants: {
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const activeStudents = Number(baseStatsResult?.activeStudents ?? 0);
    const activeEnrollments = Number(baseStatsResult?.activeEnrollments ?? 0);
    const pendingEnrollments = Number(baseStatsResult?.pendingEnrollments ?? 0);
    const activeAccess = Number(baseStatsResult?.activeAccess ?? 0);
    const pendingAccess = Number(baseStatsResult?.pendingAccess ?? 0);

    const stageCountMap = new Map(
      stageCounts.map((item) => [item.stage, Number(item.count)]),
    );
    const enrollmentCountMap = new Map<EnrollmentStatus, number>(
      enrollmentCounts.map((item) => [item.status, Number(item.count)]),
    );
    const productEnrollmentCountMap = new Map(
      productEnrollmentCounts.map((item) => [item.productId, Number(item.count)]),
    );

    const liveDeskStudents = stageCountMap.get("LIVE_DESK") ?? 0;
    const onboardingStudents = stageCountMap.get("ONBOARDING") ?? 0;
    const estimatedRevenue = products.reduce(
      (total, product) =>
        total +
        (productEnrollmentCountMap.get(product.id) ?? 0) * Number(product.price),
      0,
    );

    const students = recentStudents.map((student) => {
      const activeEnrollment = student.enrollments[0];
      const latestAccess = student.accessGrants[0];

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        plan: activeEnrollment?.product.name ?? "Sem plano",
        stage: stageLabelMap[student.stage],
        accessStatus: accessStatusMap[latestAccess?.status ?? "PENDING"],
        mentor: student.mentorName ?? "Nao definido",
        updatedAt: formatRelativeDate(student.updatedAt),
      } satisfies StudentRecord;
    });

    const accessModuleAccumulator = new Map<string, AccessModule>();

    for (const item of moduleCounts) {
      const current = accessModuleAccumulator.get(item.moduleKey) ?? {
        name: prettifyModuleKey(item.moduleKey),
        active: 0,
        pending: 0,
        blocked: 0,
        description:
          moduleDescriptionMap[item.moduleKey] ??
          "Modulo operacional controlado via Access Grant.",
      };

      if (item.status === "ACTIVE") {
        current.active = Number(item.count);
      }

      if (item.status === "PENDING") {
        current.pending = Number(item.count);
      }

      if (item.status === "BLOCKED" || item.status === "EXPIRED") {
        current.blocked += Number(item.count);
      }

      accessModuleAccumulator.set(item.moduleKey, current);
    }

    return {
      company: getCompanySnapshot(),
      kpis: [
        {
          label: "Alunos ativos",
          value: String(activeStudents),
          trend: `${liveDeskStudents} em mesa real`,
          hint: "Base atual sincronizada com o banco Postgres.",
          tone: "brand",
        },
        {
          label: "Inscricoes ativas",
          value: String(activeEnrollments),
          trend: `${pendingEnrollments} pendentes`,
          hint: "Inscricoes lidas diretamente da tabela Enrollment.",
          tone: "neutral",
        },
        {
          label: "Acessos liberados",
          value: String(activeAccess),
          trend: `${pendingAccess} em analise`,
          hint: "Acessos consolidados a partir dos Access Grants ativos.",
          tone: "brand",
        },
        {
          label: "Receita mensal",
          value: formatCurrency(estimatedRevenue),
          trend: `${products.length} produtos ativos`,
          hint: "Projecao baseada nas inscricoes ativas e precos cadastrados.",
          tone: "warning",
        },
      ],
      students,
      enrollments: [
        {
          label: "Pendentes",
          total: enrollmentCountMap.get("PENDING") ?? 0,
          description: "Inscricoes aguardando ativacao manual ou validacao.",
        },
        {
          label: "Ativos",
          total: enrollmentCountMap.get("ACTIVE") ?? 0,
          description: "Inscricoes em andamento com vinculo operacional ativo.",
        },
        {
          label: "Pausados",
          total: enrollmentCountMap.get("PAUSED") ?? 0,
          description: "Casos em pausa operacional ou financeira.",
        },
        {
          label: "Concluidos",
          total: enrollmentCountMap.get("COMPLETED") ?? 0,
          description: "Inscricoes finalizadas ao longo da jornada do trader.",
        },
      ],
      plans: products.map((product) => ({
        name: product.name,
        activeStudents: productEnrollmentCountMap.get(product.id) ?? 0,
        revenueShare: formatCurrency(
          (productEnrollmentCountMap.get(product.id) ?? 0) *
            Number(product.price),
        ),
        maxContracts: product.maxContracts
          ? `${product.maxContracts} contratos`
          : "Sem limite definido",
        highlight:
          planHighlightMap[product.slug] ??
          "Produto ativo disponivel na base atual da MTCprop.",
      })),
      accessModules: Array.from(accessModuleAccumulator.values()).sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
      pendingActions: buildPendingActions({
        pendingEnrollments,
        pendingAccess,
        onboardingStudents,
        liveDeskStudents,
      }),
      activityTimeline: buildActivityTimeline({
        activeStudents,
        activeEnrollments,
        activeAccess,
        liveDeskStudents,
      }),
    };
  },
  [CACHE_TAGS.DASHBOARD_OVERVIEW],
  {
    revalidate: 45,
    tags: [CACHE_TAGS.DASHBOARD_OVERVIEW],
  },
);
