import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

// 创建邮件传输器
const transporter = nodemailer.createTransport({
    host: "smtp.163.com",     // 163邮箱服务器
    port: 25,                 // 端口号
    secure: false,            // 不使用SSL
    auth: {
        user: process.env.SMTP_USER,     // 发件邮箱账号
        pass: process.env.SMTP_PASSWORD,      // 邮箱授权码
    },
});

// 生成验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码
async function sendVerificationCode(email: string, code: string) {
    const mailOptions = {
        from: "bmy_share@163.com",  // 发件人邮箱
        to: email,
        subject: '密码重置验证码',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>密码重置验证码</h2>
                <p>您的验证码是：<strong>${code}</strong></p>
                <p>验证码有效期为10分钟。</p>
                <p>如果这不是您的操作，请忽略此邮件。</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

// 发送验证码的处理函数
export async function POST(request: Request) {
    try {
        const { email, code, newPassword } = await request.json();

        // 验证邮箱是否存在
        const users = await query(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        ) as any[];

        if (users.length === 0) {
            return NextResponse.json(
                { error: '该邮箱未注册' },
                { status: 404 }
            );
        }

        // 如果提供了验证码和新密码，则验证并更新密码
        if (code && newPassword) {
            // 验证码验证逻辑（这里需要与您的验证码存储方式对应）
            const storedCode = await query(
                'SELECT code, created_at FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1',
                [email]
            ) as any[];

            if (storedCode.length === 0 || storedCode[0].code !== code) {
                return NextResponse.json(
                    { error: '验证码无效' },
                    { status: 400 }
                );
            }

            // 检查验证码是否过期（10分钟）
            const codeCreatedAt = new Date(storedCode[0].created_at);
            if (Date.now() - codeCreatedAt.getTime() > 10 * 60 * 1000) {
                return NextResponse.json(
                    { error: '验证码已过期' },
                    { status: 400 }
                );
            }

            // 更新密码
            // const hashedPassword = await bcrypt.hash(newPassword, 10);
            const hashedPassword = newPassword; // 临时使用明文密码

            await query(
                'UPDATE Users SET password = ? WHERE email = ?',
                [hashedPassword, email]
            );

            // 删除已使用的验证码
            await query(
                'DELETE FROM verification_codes WHERE email = ?',
                [email]
            );

            return NextResponse.json({ message: '密码已成功重置' });
        }

        // 生成并发送新的验证码
        const verificationCode = generateVerificationCode();
        
        // 存储验证码
        await query(
            'INSERT INTO verification_codes (email, code, created_at) VALUES (?, ?, NOW())',
            [email, verificationCode]
        );

        // 发送验证码邮件
        await sendVerificationCode(email, verificationCode);

        return NextResponse.json({ message: '验证码已发送到您的邮箱' });
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: '处理请求时出现错误' },
            { status: 500 }
        );
    }
} 