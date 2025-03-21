import { NextResponse } from 'next/server';
import { verifyCode, debugListAllCodes } from '@/lib/codeCache';

/**
 * 验证验证码
 * POST /api/auth/verify-code
 */
export async function POST(request: Request) {
    try {
        console.log('收到验证码验证请求');
        const { email, code } = await request.json();

        console.log(`验证参数: email=${email}, code=${code}`);

        if (!email || !code) {
            console.log('验证失败: 邮箱或验证码为空');
            return NextResponse.json(
                { message: '邮箱和验证码不能为空' },
                { status: 400 }
            );
        }

        // 输出当前所有缓存的验证码(调试用)
        debugListAllCodes();

        // 验证验证码
        const isValid = verifyCode(email, code);

        console.log(`验证结果: ${isValid ? '成功' : '失败'}`);

        if (!isValid) {
            return NextResponse.json(
                { message: '验证码无效或已过期' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: '验证码验证成功' },
            { status: 200 }
        );
    } catch (error) {
        console.error('验证码验证失败:', error);
        return NextResponse.json(
            { message: '验证码验证失败' },
            { status: 500 }
        );
    }
} 