import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (isRemote ? '4000' : '3306'), 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'WJ28@krhps',
  database: process.env.DB_NAME || 'college_management_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isRemote ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
});

export default pool;

