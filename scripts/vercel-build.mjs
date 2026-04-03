import { spawn } from "node:child_process";

function stepLog(message) {
  console.log(`\n[vercel-build] ${message}`);
}

function fail(message) {
  console.error(`\n[vercel-build] ERRO: ${message}`);
  process.exit(1);
}

function validatePostgresUrl(name, value) {
  if (!value) {
    fail(`A variavel ${name} nao esta definida.`);
  }

  if (!/^postgres(ql)?:\/\//.test(value)) {
    fail(
      `A variavel ${name} precisa comecar com postgres:// ou postgresql://. Valor atual invalido detectado.`,
    );
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    fail(`A variavel ${name} nao esta em formato de URL valido.`);
  }

  if (!parsed.hostname) {
    fail(`A variavel ${name} nao possui hostname.`);
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    fail(`A variavel ${name} nao possui nome do banco no path.`);
  }

  if (process.env.VERCEL && ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    fail(
      `A variavel ${name} esta apontando para ${parsed.hostname}. Em deploy da Vercel isso precisa ser a URL remota do banco.`,
    );
  }

  const maskedUser = parsed.username ? `${parsed.username}:***@` : "";
  const queryKeys = [...parsed.searchParams.keys()];
  const maskedQuery = queryKeys.length > 0 ? `?${queryKeys.join("&")}` : "";

  stepLog(
    `${name} validada -> ${parsed.protocol}//${maskedUser}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}${maskedQuery}`,
  );
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    stepLog(`Executando: ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        stepLog(`Concluido com sucesso: ${command} ${args.join(" ")}`);
        resolve();
        return;
      }

      reject(new Error(`Falhou com exit code ${code ?? "desconhecido"}: ${command} ${args.join(" ")}`));
    });
  });
}

async function main() {
  stepLog("Iniciando pipeline de build da Vercel");

  validatePostgresUrl("DATABASE_URL", process.env.DATABASE_URL);
  validatePostgresUrl("DIRECT_URL", process.env.DIRECT_URL);

  await run("pnpm", ["db:generate"]);
  await run("pnpm", ["db:migrate:deploy"]);
  await run("pnpm", ["build"]);

  stepLog("Pipeline finalizado com sucesso");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Falha desconhecida no pipeline da Vercel.");
});
