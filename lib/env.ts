// Import this FIRST in bin/ entrypoints and db/seed — side-effect imports run
// in order, so env vars are loaded before @/db (which reads DATABASE_URL at
// module load). .env.local wins over .env (dotenv keeps the first value seen).
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
