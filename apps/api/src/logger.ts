import pino from "pino";

import { config } from "./config.js";

/**
 * Application logger. Never log document contents or API keys.
 * Pretty output in development, structured JSON otherwise.
 */
export const logger = pino({
  level: config.isTest ? "silent" : config.isProd ? "info" : "debug",
  ...(config.isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});
