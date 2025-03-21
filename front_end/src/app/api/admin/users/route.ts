import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

/**
 * 添加新用户
 * POST /api/admin/users
 * 需要管理员权限
 */
export async function POST(request: Request) {
    try {
        // 鉴权检查
        const session = await auth();
        if (!session || session.user.permission !== 'admin') {
            console.log('权限不足', session?.user);
            return NextResponse.json(
                { error: '权限不足，需要管理员权限' },
                { status: 403 }
            );
        }

        // 获取请求数据
        const { username, email, password, permission } = await request.json();

        // 验证请求数据
        if (!username || !email || !password) {
            console.log('添加失败: 缺少必要字段');
            return NextResponse.json(
                { error: '请提供用户名、邮箱和密码' },
                { status: 400 }
            );
        }

        // 检查权限值是否有效
        const validPermissions = ['admin', 'user', 'banned'];
        if (permission && !validPermissions.includes(permission)) {
            console.log('添加失败: 权限值无效');
            return NextResponse.json(
                { error: '权限值无效' },
                { status: 400 }
            );
        }

        console.log(`管理员正在添加新用户: ${username}, ${email}, 权限: ${permission}`);

        // 检查邮箱是否已存在
        const existingUser = await (prisma as any).users.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('添加失败: 邮箱已存在');
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            );
        }

        // 仅对密码进行加密，ID 由数据库自动生成（自增）
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const user = await (prisma as any).users.create({
            data: {
                email,
                password: hashedPassword,
                username,
                permission: permission || 'user'
            },
        });

        console.log(`用户添加成功，ID: ${user.id} (整数类型)`);

        return NextResponse.json({
            message: '用户添加成功',
            user: {
                id: user.id, // 整数类型ID
                username: user.username,
                email: user.email,
                permission: user.permission
            }
        });
    } catch (error) {
        console.error('添加用户错误:', error);
        return NextResponse.json(
            { error: '添加用户过程中出现错误' },
            { status: 500 }
        );
    }
} 