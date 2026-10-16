//gerar arquivo de seed para popular o banco de dados com dados iniciais 
import { createWriteStream, statSync } from 'node:fs';
import { faker } from '@faker-js/faker';
import { LOG_FILE, LOG_INTERVAL } from './consts.js'

const maxRecords = Number(process.argv[2] || Infinity); 

if (
    (!Number.isInteger(maxRecords) && Number.isFinite(maxRecords)) 
    || Number.isNaN(maxRecords)
    || maxRecords <= 0
){
        console.log("Uso: npm run seed.js -- [maxRecords]");
        console.error('O número máximo de registros deve ser um número inteiro positivo.');
        process.exit(1);
}

const stream = createWriteStream(LOG_FILE);

function generateUser() {
    return {
        ip: faker.internet.ip(),
        name: faker.name.fullName(),
        email: faker.internet.email(),
        location: faker.address.city(),
        job_area: faker.name.jobArea(),
        company: faker.company.name(),
        job_title: faker.name.jobTitle(),
        createdAt: faker.date.past().toISOString(),
    };
}

function generateLogEntry(user) {
    return {
        ...user,
        id: faker.string.uuid(),
        timestamp: faker.date.recent().toISOString(),
    }
}

//backpressure para evitar sobrecarregar o stream de escrita
function writeRecord(line){
    return new Promise((resolve) => {
        if(!stream.write(line + '\n')) {
            stream.once('drain', resolve);
        }else{
            resolve();
        }
    });
}

const users = Array.from({ length: 5 }, generateUser); 

process.on('SIGINT', () => {
    console.log('\nInterrupção recebida. Encerrando o processo...');
    stream.end(() => {
        console.log(`Arquivo de log "${LOG_FILE}" gerado com sucesso com ${count.toLocaleString()} registros.`);
        process.exit(0);
    });
})

let count = 0;
console.log('Quantidade máxima:', maxRecords);
while (count < maxRecords) {
    const user = faker.helpers.arrayElement(users); 
    const record = generateLogEntry(user); 

    await writeRecord(JSON.stringify(record)); 
    count++;

    if (count % LOG_INTERVAL === 0) {
        const {size} = statSync(LOG_FILE);
        console.log(`Registros gerados: ${count.toLocaleString()}, Tamanho do arquivo: ${size /1024 /1024/1024 } GB`);
    }
}

stream.end(() => {
    console.log(`Arquivo de log "${LOG_FILE}" gerado com sucesso com ${count.toLocaleString()} registros.`);
})