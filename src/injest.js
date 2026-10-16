//ler linha por linha e add no db
import { createReadStream } from "node:fs";
import { createDb } from "./db.js";
import { createInterface } from "node:readline";
import { LOG_FILE, LOG_INTERVAL } from './consts.js'

const db = createDb();
const fileStream = createReadStream(LOG_FILE);
const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

console.log(`lendo arquivo de log "${LOG_FILE}" e inserindo no banco de dados...`);

let count = 0;

for await (const line of rl) {
    if(!line.trim()) continue; //ignorar linhas em branco

    let record 
    try{
        record = JSON.parse(line);
    }catch(err){
        console.error(`Erro ao analisar a linha ${count + 1}: ${err.message}`);
        continue;
    }

    db.prepare(`
        INSERT INTO access_logs (id, ip,  name, email, location, job_area, company, job_title, created_at, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        record.id,
        record.ip,
        record.name,
        record.email,
        record.location,
        record.job_area,
        record.company,
        record.job_title,
        record.createdAt,
        record.timestamp
    );

    count++

    if (count % LOG_INTERVAL === 0) {
        console.log(`${count.toLocaleString()} registros inseridos no banco de dados...`);
    }
    
}

db.close()