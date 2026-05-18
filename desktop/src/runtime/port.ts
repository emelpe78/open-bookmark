import { createServer } from "node:net";
import { APP_PORT } from "./constants.js";

export function assertPortAvailable(port = APP_PORT): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} ist bereits belegt. Beende den anderen Prozess oder schließe eine zweite OpenBookmark-Instanz.`,
          ),
        );
        return;
      }
      reject(error);
    });
    server.once("listening", () => {
      server.close(() => resolve());
    });
    server.listen(port, "127.0.0.1");
  });
}
