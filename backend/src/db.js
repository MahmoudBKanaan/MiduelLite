import pg from 'pg';

const { Pool } = pg;

/**
 * PostgreSQL pool configured exclusively via DATABASE_URL.
 * Example: postgresql://user:pass@host:5432/dbname
 */


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a parameterized SQL query (never concatenate user input).
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Borrow a client for transactions.
 */
export async function getClient() {
  return pool.connect();
}

export default pool;
