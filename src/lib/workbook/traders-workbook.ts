import fs from "node:fs";
import path from "node:path";

import type { StudentStage } from "@prisma/client";
import * as XLSX from "xlsx";

export type TraderSeedRecord = {
  name: string;
  planSlug: string;
  startedAt: Date;
  stage: StudentStage;
  sourceSheet: string;
};

export type TraderWorkbookOrigin = "Challenge" | "Fast" | "Conta real";

type ParsedWorkbookRecord = {
  name: string;
  slug: string;
  rawPlan: string | null;
  planSlug: string | null;
  startedAt: Date;
  stage: StudentStage;
  sourceSheet: string;
  sourceLabel: TraderWorkbookOrigin;
  monthlyDates: Date[];
};

export type WorkbookTraderInsight = {
  slug: string;
  name: string;
  currentPlanName: string | null;
  currentPlanSlug: string | null;
  currentStartedAt: Date;
  currentStage: StudentStage;
  primarySource: TraderWorkbookOrigin;
  primarySourceSheet: string;
  sourceSheets: string[];
  historyCount: number;
  salesHistoryCount: number;
  hasRestartBenefit: boolean;
  hasLiveDeskHistory: boolean;
  monthlyDates: Date[];
  nextMonthlyDueAt: Date | null;
};

export type WorkbookTradersDataset = {
  workbookPath: string;
  traders: WorkbookTraderInsight[];
  traderBySlug: Map<string, WorkbookTraderInsight>;
  seedRecords: TraderSeedRecord[];
};

const STAGE_PRIORITY: Record<StudentStage, number> = {
  ONBOARDING: 1,
  TRAINING: 2,
  EVALUATION: 3,
  SIMULATOR: 4,
  LIVE_DESK: 5,
};

let cachedDataset: WorkbookTradersDataset | null = null;

function getWorkbookPath() {
  const configuredPath = process.env.WORKBOOK_PATH?.trim();
  const candidates = [
    configuredPath ? path.resolve(process.cwd(), configuredPath) : null,
    path.resolve(process.cwd(), "../../docs/planilhaBase.xlsx"),
    path.resolve(process.cwd(), "../docs/planilhaBase.xlsx"),
    path.resolve(process.cwd(), "docs/planilhaBase.xlsx"),
  ].filter((value): value is string => Boolean(value));

  const workbookPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!workbookPath) {
    throw new Error(
      `Planilha nao encontrada. Defina WORKBOOK_PATH ou mantenha docs/planilhaBase.xlsx na raiz do repositório. Caminhos tentados: ${candidates.join(", ")}`,
    );
  }

  return workbookPath;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function slugifyTraderName(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizePlanText(value: string) {
  return normalizeText(value)
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidTraderName(value: string) {
  const normalized = normalizeText(value);
  return normalized.length >= 5 && /[A-Z]/.test(normalized);
}

function toDate(value: Date | number | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapPlanToSlug(rawPlan: unknown) {
  if (typeof rawPlan !== "string") {
    return null;
  }

  const normalized = sanitizePlanText(rawPlan);

  if (normalized.includes("AVANCADO FAST PRO")) {
    return "plano-avancado-fast-pro";
  }

  if (normalized.includes("INTERMEDIARIO FAST PRO")) {
    return "plano-intermediario-fast-pro";
  }

  if (normalized.includes("AVANCADO FAST")) {
    return "plano-avancado-fast";
  }

  if (normalized.includes("INTERMEDIARIO FAST")) {
    return "plano-intermediario-fast";
  }

  if (normalized.includes("EXPERT")) {
    return "plano-expert";
  }

  if (normalized.includes("AVANCADO")) {
    return "plano-avancado";
  }

  if (normalized.includes("INTERMEDIARIO")) {
    return "plano-intermediario";
  }

  if (normalized.includes("START") || normalized.includes("STAT")) {
    return "plano-start";
  }

  return null;
}

function parseApproval(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  return normalizeText(value).includes("SIM");
}

function choosePreferredRecord(
  current: ParsedWorkbookRecord | undefined,
  candidate: ParsedWorkbookRecord,
) {
  if (!current) {
    return candidate;
  }

  const currentPriority = STAGE_PRIORITY[current.stage];
  const candidatePriority = STAGE_PRIORITY[candidate.stage];

  if (candidatePriority > currentPriority) {
    return candidate;
  }

  if (
    candidatePriority === currentPriority &&
    candidate.startedAt.getTime() > current.startedAt.getTime()
  ) {
    return candidate;
  }

  return current;
}

function dedupeDates(dates: Date[]) {
  return Array.from(new Map(dates.map((date) => [date.getTime(), date])).values()).sort(
    (left, right) => left.getTime() - right.getTime(),
  );
}

function pickNextMonthlyDue(dates: Date[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dates.find((date) => date.getTime() >= today.getTime()) ?? null;
}

function readRows(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<(string | Date | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: null,
  });
}

function parseChallengeSheet(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets.DADOS;

  if (!sheet) {
    return [];
  }

  const rows = readRows(sheet);
  const records: ParsedWorkbookRecord[] = [];

  for (const row of rows.slice(8)) {
    const name = typeof row[0] === "string" ? row[0].trim() : "";
    const rawPlan = typeof row[1] === "string" ? row[1].trim() : null;
    const startedAt = toDate(row[2]);

    if (!isValidTraderName(name) || !startedAt) {
      continue;
    }

    const approvedTest = parseApproval(row[4]);
    const approvedSr = parseApproval(row[7]);
    const stage: StudentStage = approvedSr
      ? "LIVE_DESK"
      : approvedTest
        ? "SIMULATOR"
        : "EVALUATION";

    records.push({
      name,
      slug: slugifyTraderName(name),
      rawPlan,
      planSlug: mapPlanToSlug(rawPlan),
      startedAt,
      stage,
      sourceSheet: "DADOS",
      sourceLabel: "Challenge",
      monthlyDates: [],
    });
  }

  return records;
}

function parseFastSheet(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["DADOS SEM TESTE"];

  if (!sheet) {
    return [];
  }

  const rows = readRows(sheet);
  const records: ParsedWorkbookRecord[] = [];

  for (const row of rows.slice(8)) {
    const name = typeof row[0] === "string" ? row[0].trim() : "";
    const rawPlan = typeof row[1] === "string" ? row[1].trim() : null;
    const startedAt = toDate(row[2]);

    if (!isValidTraderName(name) || !startedAt) {
      continue;
    }

    const monthlyDates = row
      .slice(5, 13)
      .map((value) => toDate(value))
      .filter((value): value is Date => value instanceof Date);

    records.push({
      name,
      slug: slugifyTraderName(name),
      rawPlan,
      planSlug: mapPlanToSlug(rawPlan),
      startedAt,
      stage: parseApproval(row[4]) ? "LIVE_DESK" : "SIMULATOR",
      sourceSheet: "DADOS SEM TESTE",
      sourceLabel: "Fast",
      monthlyDates,
    });
  }

  return records;
}

function parseLiveDeskSheet(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["CONTA REAL"];

  if (!sheet) {
    return [];
  }

  const rows = readRows(sheet);
  const startDates = rows[4] ?? [];
  const names = rows[5] ?? [];
  const plans = rows[6] ?? [];
  const records: ParsedWorkbookRecord[] = [];

  for (let index = 1; index < names.length; index += 1) {
    const rawName = names[index];
    const rawPlanCell = plans[index];
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const rawPlan = typeof rawPlanCell === "string" ? rawPlanCell.trim() : null;
    const startedAt = toDate(startDates[index]);

    if (!isValidTraderName(name) || !startedAt) {
      continue;
    }

    records.push({
      name,
      slug: slugifyTraderName(name),
      rawPlan,
      planSlug: mapPlanToSlug(rawPlan),
      startedAt,
      stage: "LIVE_DESK",
      sourceSheet: "CONTA REAL",
      sourceLabel: "Conta real",
      monthlyDates: [],
    });
  }

  return records;
}

function parseRestartSlugs(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["REINÍCIO"];

  if (!sheet) {
    return new Set<string>();
  }

  const rows = readRows(sheet);
  const slugs = new Set<string>();

  for (const row of rows.slice(1)) {
    const name = typeof row[0] === "string" ? row[0].trim() : "";

    if (isValidTraderName(name)) {
      slugs.add(slugifyTraderName(name));
    }
  }

  return slugs;
}

function parsePlatformMonthlyMap(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["MENSALIDADE PLATAFORMA"];

  if (!sheet) {
    return new Map<string, Date[]>();
  }

  const rows = readRows(sheet);
  const headerRow = rows[0] ?? [];
  const monthlyMap = new Map<string, Date[]>();

  for (let index = 0; index < headerRow.length; index += 1) {
    const rawName = headerRow[index];
    const name = typeof rawName === "string" ? rawName.trim() : "";

    if (!isValidTraderName(name)) {
      continue;
    }

    const dates = rows
      .slice(1)
      .map((row) => toDate(row[index]))
      .filter((value): value is Date => value instanceof Date);

    monthlyMap.set(slugifyTraderName(name), dedupeDates(dates));
  }

  return monthlyMap;
}

function buildDataset() {
  const workbookPath = getWorkbookPath();

  const workbook = XLSX.readFile(workbookPath, {
    cellDates: true,
  });

  const parsedRecords = [
    ...parseChallengeSheet(workbook),
    ...parseFastSheet(workbook),
    ...parseLiveDeskSheet(workbook),
  ];

  const restartSlugs = parseRestartSlugs(workbook);
  const platformMonthlyMap = parsePlatformMonthlyMap(workbook);
  const primaryRecordMap = new Map<string, ParsedWorkbookRecord>();
  const aggregated = new Map<
    string,
    {
      name: string;
      records: ParsedWorkbookRecord[];
      sourceSheets: Set<string>;
      salesHistoryCount: number;
    }
  >();

  for (const record of parsedRecords) {
    const current = aggregated.get(record.slug) ?? {
      name: record.name,
      records: [],
      sourceSheets: new Set<string>(),
      salesHistoryCount: 0,
    };

    current.records.push(record);
    current.sourceSheets.add(record.sourceSheet);

    if (record.sourceSheet !== "CONTA REAL") {
      current.salesHistoryCount += 1;
    }

    aggregated.set(record.slug, current);
    primaryRecordMap.set(
      record.slug,
      choosePreferredRecord(primaryRecordMap.get(record.slug), record),
    );
  }

  const traders = Array.from(aggregated.entries())
    .map(([slug, value]) => {
      const primaryRecord = primaryRecordMap.get(slug);

      if (!primaryRecord) {
        return null;
      }

      const recordMonthlyDates = value.records.flatMap((record) => record.monthlyDates);
      const platformMonthlyDates = platformMonthlyMap.get(slug) ?? [];
      const monthlyDates = dedupeDates([
        ...recordMonthlyDates,
        ...platformMonthlyDates,
      ]);

      return {
        slug,
        name: primaryRecord.name,
        currentPlanName: primaryRecord.rawPlan,
        currentPlanSlug: primaryRecord.planSlug,
        currentStartedAt: primaryRecord.startedAt,
        currentStage: primaryRecord.stage,
        primarySource: primaryRecord.sourceLabel,
        primarySourceSheet: primaryRecord.sourceSheet,
        sourceSheets: Array.from(value.sourceSheets).sort((left, right) =>
          left.localeCompare(right, "pt-BR"),
        ),
        historyCount: value.records.length,
        salesHistoryCount: value.salesHistoryCount,
        hasRestartBenefit: restartSlugs.has(slug),
        hasLiveDeskHistory: value.records.some(
          (record) => record.stage === "LIVE_DESK" || record.sourceSheet === "CONTA REAL",
        ),
        monthlyDates,
        nextMonthlyDueAt: pickNextMonthlyDue(monthlyDates),
      } satisfies WorkbookTraderInsight;
    })
    .filter((value): value is WorkbookTraderInsight => value !== null)
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  const seedRecords = traders
    .filter(
      (trader): trader is WorkbookTraderInsight & { currentPlanSlug: string } =>
        typeof trader.currentPlanSlug === "string",
    )
    .map((trader) => ({
      name: trader.name,
      planSlug: trader.currentPlanSlug,
      startedAt: trader.currentStartedAt,
      stage: trader.currentStage,
      sourceSheet: trader.primarySourceSheet,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  return {
    workbookPath,
    traders,
    traderBySlug: new Map(traders.map((trader) => [trader.slug, trader])),
    seedRecords,
  } satisfies WorkbookTradersDataset;
}

export function loadWorkbookTradersDataset() {
  if (cachedDataset) {
    return cachedDataset;
  }

  cachedDataset = buildDataset();
  return cachedDataset;
}

export function loadWorkbookSeedData() {
  const dataset = loadWorkbookTradersDataset();

  return {
    workbookPath: dataset.workbookPath,
    traders: dataset.seedRecords,
  };
}
