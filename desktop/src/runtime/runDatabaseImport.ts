import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { buildRuntimeEnv, type RuntimePaths } from "./paths.js";

export async function runDatabaseImport(
  paths: RuntimePaths,
  sqlFilePath: string,
): Promise<void> {
  const scriptPath = path.join(paths.runtimeRoot, "scripts/import-database.mjs");
  if (!existsSync(scriptPath)) {
    throw new Error(
      `Import-Skript fehlt (${scriptPath}). Führe „cd open-bookmark && npm run build“ aus.`,
    );
  }

  const env = buildRuntimeEnv(paths);

  return new Promise((resolve, reject) => {
    const child = spawn(paths.nodeBinary, [scriptPath, sqlFilePath], {
      cwd: paths.runtimeRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const message = stderr.trim() || `SQL-Import beendet (code=${code ?? "?"})`;
      reject(new Error(message));
    });
  });
}
