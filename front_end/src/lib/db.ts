import mysql from 'mysql2/promise';

// 创建数据库连接池
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 执行 SQL 查询的工具函数
export async function query(sql: string, params: any[] = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
} 