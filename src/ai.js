import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const model =openai('gpt-4o-mini')

const SCHEMA_DESCRIPTION = `
 Table: access_logs
 Columns: 
- id: TEXT, PRIMARY KEY
- ip: TEXT, NOT NULL
- name: TEXT, NOT NULL
- email: TEXT, NOT NULL
- location: TEXT, NOT NULL
- job_area: TEXT, NOT NULL
- company: TEXT, NOT NULL
- job_title: TEXT, NOT NULL
- created_at: TEXT, NOT NULL
- timestamp: TEXT, NOT NULL
`

const BLOCKED_KEYWORDS =
    ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
        'TRUNCATE', 'EXECUTE', 'MERGE', 'CALL', 'GRANT', 'REVOKE',
        'REPLACE', 'UNLOCK', 'PRAGMA', 'ATTACH',
        'VACUUM', 'COMMIT', 'ROLLBACK'];

const sqlSuggestionSchema = z.object({
    sql: z.string().min(1, 'SQL não pode ser vazio.'),
    explanation: z.string()
});

export function validateSql(sql) {
    if (typeof sql !== 'string' || sql.trim() === '') {
        throw new Error('SQL inválido: não é uma string.');
    }
    const safeSql = sql.trim().replace(/;\s*$/, '').trim();

    for (const keyword of BLOCKED_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(safeSql)) {
            throw new Error(`SQL inválido: contém palavra-chave bloqueada "${keyword}".`);
        }
    }

    return safeSql
}

export async function generateSqlObject(question) {
    const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: sqlSuggestionSchema }),
        system: `
        Você é um assistente especialista em SQLite.
  
        Sua tarefa é gerar uma única query SQL para responder pergunta do(a) usuário(a).
  
        Regras obrigatórias:
        - Gere apenas SELECT.
        - Use apenas a tabela access_logs.
        - Não use ${BLOCKED_KEYWORDS.join(', ')}.
        - Não gere múltiplas queries.
        - Não use comentários SQL.
        - Se a pergunta não puder ser respondida com o schema disponível, gere uma query simples de inspeção ou explique a limitação.
  
        Schema disponível:
        ${SCHEMA_DESCRIPTION}`,
        prompt: `
        Pergunta do usuário:
        ${question}
      `,
    });

    if (!experimental_output?.sql) {
        throw new Error('O modelo nao retornou uma sugestão SQL valida.');
    }

    return {
        sql: validateSql(experimental_output.sql),
        explanation: experimental_output.explanation,
    };
}

generateSqlObject("Quantos acessos tivemos por localização?")
    .then(({ sql, explanation }) => {
        console.log("SQL Gerada:", sql);
        console.log("Explicação:", explanation);
    });