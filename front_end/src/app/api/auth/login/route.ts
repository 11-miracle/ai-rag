import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 验证请求数据
        if (!email || !password) {
            return NextResponse.json(
                { error: '请提供邮箱和密码' },
                { status: 400 }
            );
        }

        // 查询用户
        const users = await query(
            'SELECT id, username, email, password FROM Users WHERE email = ?',
            [email]
        ) as any[];

        if (users.length === 0) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 401 }
            );
        }

        const user = users[0];

        // 验证密码
        // const isValid = await bcrypt.compare(password, user.password);
        const isValid = password === user.password; // 临时使用明文密码比较，生产环境需要使用 bcrypt

        if (!isValid) {
            return NextResponse.json(
                { error: '密码错误' },
                { status: 401 }
            );
        }

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;
        
        return NextResponse.json({
            user: userWithoutPassword,
            message: '登录成功'
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: '登录过程中出现错误' },
            { status: 500 }
        );
    }
} 