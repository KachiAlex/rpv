import { Pool, type QueryResult, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is missing');
    }
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

type SqlValue = string | number | boolean | null | Date | Buffer | string[] | number[] | boolean[];

interface SqlTagResult {
  rows: QueryResultRow[];
  rowCount: number;
}

export async function sql(strings: TemplateStringsArray, ...values: SqlValue[]): Promise<SqlTagResult> {
  const db = getDb();
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  const result: QueryResult<QueryResultRow> = await db.query(text, values as unknown[]);
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? 0,
  };
}
