const DEFAULT_SUPABASE_DB_NAME = "postgres";
const DEFAULT_SUPABASE_REGION = "us-east-2";
const DEFAULT_SUPABASE_DB_USER = "postgres";
const DEFAULT_SUPABASE_POOLER_CLUSTER = "aws-1";

type DatabaseEnvResolution = {
  databaseUrl: string | null;
  directUrl: string | null;
  source: "direct" | "supabase-derived" | "missing";
};

function hasValue(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildSupabaseDatabaseUrl(params: {
  projectRef: string;
  region: string;
  password: string;
  dbName: string;
  dbUser: string;
  poolerCluster: string;
}) {
  const encodedPassword = encodeURIComponent(params.password);
  return `postgresql://${params.dbUser}.${params.projectRef}:${encodedPassword}@${params.poolerCluster}-${params.region}.pooler.supabase.com:6543/${params.dbName}?pgbouncer=true`;
}

function buildSupabaseDirectUrl(params: {
  projectRef: string;
  region: string;
  password: string;
  dbName: string;
  dbUser: string;
  poolerCluster: string;
}) {
  const encodedPassword = encodeURIComponent(params.password);
  return `postgresql://${params.dbUser}.${params.projectRef}:${encodedPassword}@${params.poolerCluster}-${params.region}.pooler.supabase.com:5432/${params.dbName}`;
}

export function resolveDatabaseEnv(env: NodeJS.ProcessEnv = process.env): DatabaseEnvResolution {
  const directDatabaseUrl = env.DATABASE_URL?.trim() || null;
  const directUrl = env.DIRECT_URL?.trim() || null;
  const shouldPreferDirectConnection = !env.VERCEL;

  if (directDatabaseUrl && directUrl) {
    return {
      databaseUrl: shouldPreferDirectConnection ? directUrl : directDatabaseUrl,
      directUrl,
      source: "direct",
    };
  }

  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  const password = env.SUPABASE_DB_PASSWORD?.trim();

  if (!hasValue(projectRef) || !hasValue(password)) {
    return {
      databaseUrl: directDatabaseUrl,
      directUrl,
      source: "missing",
    };
  }

  const region = env.SUPABASE_REGION?.trim() || DEFAULT_SUPABASE_REGION;
  const dbName = env.SUPABASE_DB_NAME?.trim() || DEFAULT_SUPABASE_DB_NAME;
  const dbUser = env.SUPABASE_DB_USER?.trim() || DEFAULT_SUPABASE_DB_USER;
  const poolerCluster =
    env.SUPABASE_POOLER_CLUSTER?.trim() || DEFAULT_SUPABASE_POOLER_CLUSTER;

  return {
    databaseUrl:
      directDatabaseUrl ||
      (shouldPreferDirectConnection
        ? directUrl ||
          buildSupabaseDirectUrl({
            projectRef,
            region,
            password,
            dbName,
            dbUser,
            poolerCluster,
          })
        : buildSupabaseDatabaseUrl({
            projectRef,
            region,
            password,
            dbName,
            dbUser,
            poolerCluster,
          })),
    directUrl:
      directUrl ||
      buildSupabaseDirectUrl({
        projectRef,
        region,
        password,
        dbName,
        dbUser,
        poolerCluster,
      }),
    source: "supabase-derived",
  };
}

export function ensureDatabaseEnv(env: NodeJS.ProcessEnv = process.env) {
  const resolved = resolveDatabaseEnv(env);

  if (resolved.databaseUrl && !env.DATABASE_URL) {
    env.DATABASE_URL = resolved.databaseUrl;
  }

  if (resolved.directUrl && !env.DIRECT_URL) {
    env.DIRECT_URL = resolved.directUrl;
  }

  return resolved;
}
