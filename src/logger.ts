import log4js, { Logger } from "log4js";

try {
    log4js.configure({
        appenders: {
            console: { type: "console" },
            // file: { type: "file", filename: "app.log" },
        },
        categories: {
            default: { appenders: ["console", /* "file" */], level: "error" },
            http: { appenders: ["console"], level: "info" },
        },
    });
} catch (e) {
    console.error(e);
    throw e;
}

export const logger: Logger = log4js.getLogger();
export const httpLogger: Logger = log4js.getLogger("http");
