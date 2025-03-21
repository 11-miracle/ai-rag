import {NextResponse} from 'next/server';
import nodemailer from 'nodemailer';
import {generateVerificationCode} from '@/lib/utils';
import {storeVerificationCode, hasActiveCode, getCodeRemainingTime, debugListAllCodes} from '@/lib/codeCache';

// 邮件发送配置
const transporter = nodemailer.createTransport({
    host: "smtp.163.com",     // 163邮箱服务器
    port: 25,                 // 端口号
    secure: false,            // 不使用SSL
    auth: {
        user: "bmy_share@163.com",     // 发件邮箱账号
        pass: "PMyA2H8tfbxjsghF",      // 邮箱授权码
    },
});

/**
 * 发送验证码
 * POST /api/auth/send-verification
 * 
 * 支持两种场景:
 * 1. 注册账户 - 发送验证码验证邮箱
 * 2. 忘记密码 - 发送验证码重置密码
 * 
 * 请求参数:
 * - email: 目标邮箱地址
 * - type: 可选，'register'(注册) 或 'reset'(重置密码)，默认为'reset'
 */
export async function POST(request: Request) {
    try {
        console.log('收到发送验证码请求');
        const {email, type = 'reset'} = await request.json();
        
        // 确定使用场景(注册或重置密码)
        const isRegister = type === 'register';
        const actionType = isRegister ? '注册账户' : '重置密码';

        console.log(`请求发送${actionType}验证码到邮箱: ${email}`);

        if (!email) {
            console.log('发送失败: 邮箱地址为空');
            return NextResponse.json(
                {message: '邮箱地址不能为空'},
                {status: 400}
            );
        }

        // 检查是否已经有未过期的验证码
        if (hasActiveCode(email)) {
            const remainingSeconds = getCodeRemainingTime(email);
            console.log(`已存在有效的验证码，剩余时间: ${remainingSeconds}秒`);
            return NextResponse.json(
                {
                    message: `请等待${remainingSeconds}秒后再重新发送验证码`,
                    remainingSeconds
                },
                {status: 429} // Too Many Requests
            );
        }

        // 生成6位数验证码
        const verificationCode = generateVerificationCode();
        console.log(`生成验证码: ${verificationCode}`);

        // 保存验证码到缓存，2分钟过期
        storeVerificationCode(email, verificationCode, 120);
        console.log(`为邮箱 ${email} 存储验证码: ${verificationCode}`);

        // 输出当前所有缓存的验证码(调试用)
        debugListAllCodes();

        // 根据不同场景设置不同的邮件内容
        const emailSubject = isRegister ? '账户注册验证码' : '密码重置验证码';
        const emailAction = isRegister ? '完成账户注册' : '重置您的密码';
        
        // 发送验证码邮件
        console.log(`准备发送${actionType}验证码邮件...`);
        await transporter.sendMail({
            from: "bmy_share@163.com",  // 发件人邮箱
            to: email,
            subject: emailSubject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${emailSubject}</h2>
                    <p>您的验证码是：<strong style="font-size: 20px; color: #4A90E2;">${verificationCode}</strong></p>
                    <p>此验证码将在2分钟后过期。</p>
                    <p>请使用此验证码${emailAction}。</p>
                    <p>如果这不是您的操作，请忽略此邮件。</p>
                </div>
            `,
        });
        console.log(`${actionType}验证码邮件发送成功`);

        return NextResponse.json(
            {message: '验证码已发送到您的邮箱'},
            {status: 200}
        );
    } catch (error) {
        console.error('发送验证码失败:', error);
        return NextResponse.json(
            {message: '发送验证码失败'},
            {status: 500}
        );
    }
} 