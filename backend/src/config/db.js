// One shared MySQL connection pool for the whole server.
const mysql = require('mysql2/promise');
const { DB } = require('./env.js');

const pool = mysql.createPool({
  ...DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Runs fn(connection) inside a transaction: commits on success, rolls everything back on any error.
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
