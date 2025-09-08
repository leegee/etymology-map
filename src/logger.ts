// import log4js, { type Logger } from "log4js";

// try {
//     log4js.configure({
//         appenders: {
//             console: { type: "console" },
//         },
//         categories: {
//             default: { appenders: ["console"], level: "debug" },
//             http: { appenders: ["console"], level: "debug" },
//         },
//     });
// } catch (e) {
//     console.error("Failed to configure log4js:", e);
//     throw e;
// }

// export const logger: Logger = log4js.getLogger();
// export const httpLogger: Logger = log4js.getLogger("http");


export const logger = console;
export const httpLogger = console;
