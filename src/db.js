import { DatabaseSync } from 'node:sqlite'

export function createDb(path = ":memory:") {
    const db = new DatabaseSync(path);
    db.exec(`
        CREATE TABLE IF NOT EXISTS access_logs (
            id TESXT PRIMARY KEY,
            ip TEXT NOT NULL,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            location TEXT NOT NULL,
            job_area TEXT NOT NULL,
            company TEXT NOT NULL,
            job_title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );
    `);
    return db;
}

createDb('access_logs.db');

