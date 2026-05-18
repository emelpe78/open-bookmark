import { ChildProcess, spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  buildRuntimeEnv,
  resolveRuntimePaths,
  type RuntimePaths,
} from "./paths.js";
import { waitForRuntimeHealthy } from "./health.js";
import { assertPortAvailable } from "./port.js";

let runtimeProcess: ChildProcess | null = null;
let runtimePaths: RuntimePaths | null = null;

function ensureRuntimeBuilt(paths: RuntimePaths): void {
  if (!existsSync(paths.serverEntry)) {
    throw new Error(
      `Nitro-Build fehlt (${paths.serverEntry}). Führe zuerst „cd open-bookmark && npm run build“ aus.`,
    );
  }
}

function attachLogging(child: ChildProcess, logsDir: string): void {
  mkdirSync(logsDir, { recursive: true });
  const logPath = path.join(logsDir, "runtime.log");
  const stream = createWriteStream(logPath, { flags: "a" });
  const stamp = new Date().toISOString();
  stream.write(`\n--- ${stamp} ---\n`);
  child.stdout?.pipe(stream);
  child.stderr?.pipe(stream);
}

export async function startRuntime(): Promise<RuntimePaths> {
  if (runtimeProcess) {
    return runtimePaths!;
  }

  const paths = resolveRuntimePaths();
  runtimePaths = paths;

  ensureRuntimeBuilt(paths);
  await assertPortAvailable();

  const env = buildRuntimeEnv(paths);
  runtimeProcess = spawn(paths.nodeBinary, [paths.serverEntry], {
    cwd: paths.runtimeRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachLogging(runtimeProcess, paths.logsDir);

  runtimeProcess.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`Runtime beendet (code=${code}, signal=${signal})`);
    }
    runtimeProcess = null;
  });

  await waitForRuntimeHealthy();
  return paths;
}

export function stopRuntime(): Promise<void> {
  if (!runtimeProcess) {
    runtimePaths = null;
    return Promise.resolve();
  }

  const child = runtimeProcess;
  runtimeProcess = null;
  runtimePaths = null;

  return new Promise((resolve) => {
    const forceKill = setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(forceKill);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

export async function restartRuntime(): Promise<RuntimePaths> {
  await stopRuntime();
  return startRuntime();
}

export function getRuntimePaths(): RuntimePaths | null {
  return runtimePaths;
}
