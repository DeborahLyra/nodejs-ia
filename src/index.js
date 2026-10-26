import { createInterface } from 'node:readline';
import { createDb } from './db.js';
import { styleText } from 'node:util';
import { DB_NAME } from './consts.js';
import { createReadStream } from 'node:fs';
import { generateSqlObject,  generateTextAnswer } from './ai.js';

const db = createDb(DB_NAME);
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

function prompt(query) {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

rl.on('close', () => {
    db.close();
    console.log('Encerrando o prompt de comando...');
    process.exit(0);
});

console.log(styleText(["bold", "cyan"], 'Bem-vindo ao prompt de comando!'));

while (true) {
    const question = await prompt(styleText(["bold", "green"], 'Digite sua pergunta: '));
    if (!question) {
        continue
    }

    try {
        const sqlObject = await generateSqlObject(question);
        const { sql, explanation } = sqlObject;

        console.log(styleText(["bold", "yellow"], `SQL gerado: ${sql}`));
        console.log(styleText(["bold", "blue"], `Explicação: ${explanation}`));

        const confirm = await prompt(styleText(["bold", "green"], 'Deseja executar? (s/n): '));
        if (confirm.toLowerCase() === 's') {
            const result = await db.prepare(sql).all().map(row => ({...row}));
            const answer = await generateTextAnswer({ question, sql, rows: result });
            console.log(
                styleText(["bold", "magenta"], `Resposta: ${answer}`)
            );
        } else {
            console.log(styleText(["bold", "red"], 'SQL não executada.'));
        }

    } catch(error) {
        console.error(styleText(["bold", "red"], `Erro ao gerar ou executar a consulta SQL: ${error.message}`));

    }
}