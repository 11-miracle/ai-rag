import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/utils';
import bcrypt from 'bcryptjs';

/**
 * 重置密码
 * POST /api/auth/reset-password
 */
export async function POST(request: Request) {
    try {
        console.log('收到密码重置请求');
        const { email, newPassword } = await request.json();

        if (!email || !newPassword) {
            console.log('重置失败: 缺少必要参数');
            return NextResponse.json(
                { message: '邮箱和新密码不能为空' },
                { status: 400 }
            );
        }

        console.log(`尝试为邮箱 ${email} 重置密码`);

        // 验证密码强度
        if (!validatePassword(newPassword)) {
            console.log('重置失败: 密码不符合要求');
            return NextResponse.json(
                { message: '密码长度必须至少6位' },
                { status: 400 }
            );
        }

        // 查找用户
        const user = await (prisma as any).users.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('重置失败: 用户不存在');
            return NextResponse.json(
                { message: '用户不存在' },
                { status: 404 }
            );
        }

        // 更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await (prisma as any).users.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        console.log('密码重置成功');
        return NextResponse.json(
            { message: '密码重置成功' },
            { status: 200 }
        );
    } catch (error) {
        console.error('密码重置失败:', error);
        return NextResponse.json(
            { message: '密码重置失败' },
            { status: 500 }
        );
    }
} 