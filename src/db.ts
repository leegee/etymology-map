import initSqlJs, { type Database as SQLDatabase } from "sql.js";
import { httpLogger } from "./logger";
import packageJson from "../package.json" assert { type: "json" };

const urlRoot = `/${packageJson.name}/`;
let db: SQLDatabase | null = null;
let isLoading = false;

const isDev = process.env.NODE_ENV !== "production";

async function loadDB() {
    if (db) return db;
    if (isLoading) {
        // Wait until another load finishes
        return new Promise<SQLDatabase>((resolve) => {
            const interval = setInterval(() => {
                if (db) {
                    clearInterval(interval);
                    resolve(db);
                }
            }, 50);
        });
    }
    isLoading = true;

    const SQL = await initSqlJs({
        locateFile: () => `${urlRoot}/sql-wasm/sql-wasm.wasm`,
    });

    const buffer = await fetch(`${urlRoot}/data/words.db`).then((res) =>
        res.arrayBuffer()
    );
    db = new SQL.Database(new Uint8Array(buffer));

    isLoading = false;
    return db;
}

function logQuery(sql: string, params: any[]) {
    if (isDev) {
        httpLogger.debug({ sql, params });
    }
}

function lazyPrepare<T = any>(sql: string) {
    return {
        all: async (...params: any[]): Promise<T[]> => {
            const database = await loadDB();
            const stmt = database.prepare(sql);
            stmt.bind(params);
            logQuery(sql, params);

            const results: T[] = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject() as T);
            }
            stmt.free();
            return results;
        },
        get: async (...params: any[]): Promise<T | null> => {
            const results = await lazyPrepare<T>(sql).all(...params);
            return results[0] ?? null;
        },
    };
}

export const stmtFindExact = lazyPrepare(
    "SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1"
);
export const stmtFindPrefix = lazyPrepare(
    "SELECT * FROM words WHERE LOWER(word) LIKE LOWER(?) LIMIT 50"
);
export const stmtFindwordLinks = lazyPrepare(
    "SELECT * FROM word_links WHERE word_id = ?"
);
export const stmtFindLike = lazyPrepare(`
    SELECT DISTINCT w.word
    FROM words w
    JOIN word_links wl ON wl.word_id = w.id
    WHERE LOWER(w.word) LIKE LOWER(?)
    LIMIT 1`
)

export { loadDB };
