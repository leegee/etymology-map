// db.ts
import Database, { Statement } from "better-sqlite3";
import { DB_FILE_PATH } from "./config";
import { httpLogger } from "./logger";

const DB_KEY = Symbol.for("myapp.db");

// Reuse global DB for dev hot reload
const globalDb = (globalThis as any)[DB_KEY];

export const db = globalDb ?? new Database(DB_FILE_PATH, {
    readonly: true,
    fileMustExist: true,
});

if (!globalDb) {
    (globalThis as any)[DB_KEY] = db;
}

const isDev = process.env.NODE_ENV !== "production";

function logQuery(sql: string, params: any[]) {
    if (isDev) {
        httpLogger.debug({ sql, params });
    }
}

function lazyPrepare<T = any>(sql: string) {
    let stmt: Statement | null = null;

    return {
        all: (...params: any[]) => {
            if (!stmt) stmt = db.prepare(sql);
            logQuery(sql, params);
            return stmt?.all(...params) as T[];
        },
        get: (...params: any[]) => {
            if (!stmt) stmt = db.prepare(sql);
            logQuery(sql, params);
            return stmt?.get(...params) as T;
        },
        run: (...params: any[]) => {
            if (!stmt) stmt = db.prepare(sql);
            logQuery(sql, params);
            return stmt?.run(...params);
        },
    };
}

// Export lazy statements
export const stmtFindExact = lazyPrepare(
    "SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1"
);
export const stmtFindPrefix = lazyPrepare(
    "SELECT * FROM words WHERE LOWER(word) LIKE LOWER(?) LIMIT 50"
);
export const stmtFindTranslations = lazyPrepare(
    "SELECT * FROM translations WHERE word_id = ?"
);
