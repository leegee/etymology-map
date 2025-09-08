import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export const DB_FILE_PATH = path.resolve(__dirname, "../data/words.db");
export const DB_FILE_PATH = path.join(process.cwd(), "data", "words.db");

