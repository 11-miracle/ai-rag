import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * 用户注册API
 * POST /api/auth/register
 * 
 * 注册流程:
 * 1. 接收用户提交的注册信息(用户名、邮箱、密码)
 * 2. 验证邮箱是否已存在
 * 3. 加密密码
 * 4. 创建用户记录
 * 5. 返回成功信息
 * 
 * 注: 此接口假设邮箱验证已在前端完成，不再需要额外的验证步骤
 */
export async function POST(request: Request) {
    try {
        // 记录请求开始
        console.log('收到注册请求');
        
        // 解析请求体
        const { username, email, password } = await request.json();

        // 验证请求数据是否完整
        if (!username || !email || !password) {
            console.log('注册失败: 缺少必要字段');
            return NextResponse.json(
                { error: '请提供用户名、邮箱和密码' },
                { status: 400 }
            );
        }

        console.log(`尝试注册用户: ${username}, ${email}`);

        // 检查邮箱是否已存在
        // 注: 虽然不需要预先查询用户，但仍需验证邮箱唯一性
        const existingUser = await (prisma as any).users.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('注册失败: 邮箱已存在');
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            );
        }

        // 对密码进行加密处理
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('密码加密完成');

        // 创建新用户记录
        // ID由数据库自动生成(自增整数)
        const user = await (prisma as any).users.create({
            data: {
                email,
                password: hashedPassword,
                username,
                permission: 'user' // 默认为普通用户权限
            },
        });

        console.log(`注册成功，用户ID: ${user.id}`);

        // 返回成功响应，包含部分用户信息(不含密码)
        return NextResponse.json({
            message: '注册成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        // 记录错误信息
        console.error('注册错误:', error);
        
        // 返回通用错误响应
        return NextResponse.json(
            { error: '注册过程中出现错误' },
            { status: 500 }
        );
    }
} 