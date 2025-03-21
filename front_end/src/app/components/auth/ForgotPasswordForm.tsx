"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmailForm } from './EmailForm';
import { VerifyCodeForm } from './VerifyCodeForm';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * 忘记密码主表单组件
 * 集成邮箱验证、验证码验证和密码重置三个步骤
 */
export const ForgotPasswordForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSending, setIsSending] = useState(false); // 防止重复点击发送按钮

    /**
     * 处理倒计时
     */
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [countdown]);

    /**
     * 处理发送验证码
     */
    const handleSendVerificationCode = async () => {
        // 防止重复点击
        if (isSending) return;

        setIsSending(true);
        setIsLoading(true);
        setError('');

        try {
            console.log(`尝试发送验证码到邮箱: ${email}`);

            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            console.log('发送验证码响应:', data);

            if (!response.ok) {
                // 如果是由于频率限制返回的错误
                if (response.status === 429 && data.remainingSeconds) {
                    setCountdown(data.remainingSeconds);
                }
                throw new Error(data.message || '发送验证码失败');
            }

            // 开始倒计时 (2分钟)
            setCountdown(120);
            setStep('verify');
        } catch (error) {
            console.error('发送验证码失败:', error);
            setError(error instanceof Error ? error.message : '发送验证码失败');
        } finally {
            setIsLoading(false);
            // 延迟重置isSending状态，防止用户快速点击
            setTimeout(() => {
                setIsSending(false);
            }, 1000);
        }
    };

    /**
     * 处理验证码验证
     */
    const handleVerifyCode = async () => {
        setIsLoading(true);
        setError('');

        try {
            console.log(`尝试验证验证码, 邮箱: ${email}, 验证码: ${verificationCode}`);

            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    code: verificationCode 
                }),
            });

            const data = await response.json();
            console.log('验证响应:', data);

            if (!response.ok) {
                throw new Error(data.message || '验证码验证失败');
            }

            setStep('reset');
        } catch (error) {
            console.error('验证码验证失败:', error);
            setError(error instanceof Error ? error.message : '验证码验证失败');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 处理密码重置
     */
    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            setError('密码长度至少为6位');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('提交密码重置请求');
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    newPassword,
                }),
            });

            const data = await response.json();
            console.log('密码重置响应:', data);

            if (!response.ok) {
                throw new Error(data.message || '重置密码失败');
            }

            // 重置成功，跳转到登录页
            router.push('/');
        } catch (error) {
            console.error('重置密码失败:', error);
            setError(error instanceof Error ? error.message : '重置密码失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        重置密码
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                            返回登录
                        </Link>
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {/* 步骤指示器 */}
                    <div className="flex justify-between mb-8">
                        <div className={`flex-1 text-center ${step === 'email' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            1. 输入邮箱
                        </div>
                        <div className={`flex-1 text-center ${step === 'verify' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            2. 验证验证码
                        </div>
                        <div className={`flex-1 text-center ${step === 'reset' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            3. 设置新密码
                        </div>
                    </div>

                    {step === 'email' && (
                        <EmailForm
                            onSendCode={handleSendVerificationCode}
                            email={email}
                            setEmail={setEmail}
                            isLoading={isLoading}
                            isSending={isSending}
                            countdown={countdown}
                            error={error}
                        />
                    )}

                    {step === 'verify' && (
                        <VerifyCodeForm
                            onVerifyCode={handleVerifyCode}
                            onResendCode={handleSendVerificationCode}
                            verificationCode={verificationCode}
                            setVerificationCode={setVerificationCode}
                            isLoading={isLoading}
                            isSending={isSending}
                            countdown={countdown}
                            error={error}
                        />
                    )}

                    {step === 'reset' && (
                        <ResetPasswordForm
                            onResetPassword={handleResetPassword}
                            newPassword={newPassword}
                            setNewPassword={setNewPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}; 