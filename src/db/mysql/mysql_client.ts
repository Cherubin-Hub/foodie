import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let mysqlPool: Pool | null = null;

export function getMySQLPool(): Pool {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'foodie_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return mysqlPool;
}