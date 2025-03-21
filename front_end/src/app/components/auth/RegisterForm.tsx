"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * 用户注册表单组件
 * 实现三步注册流程：
 * 1. 填写基本信息（用户名、邮箱、密码）
 * 2. 验证邮箱（通过验证码）
 * 3. 确认创建账户
 */
export const RegisterForm = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        verificationCode: ''
    });
    
    // 注册步骤：info(基本信息) -> verify(验证码验证) -> confirm(确认创建)
    const [step, setStep] = useState<'info' | 'verify' | 'confirm'>('info'); 
    const [countdown, setCountdown] = useState(0); // 验证码倒计时
    const [isSending, setIsSending] = useState(false); // 防止重复发送验证码
    const [isVerified, setIsVerified] = useState(false); // 验证码是否已验证

    /**
     * 处理倒计时逻辑
     * 每秒递减倒计时，直到归零
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
     * 处理表单输入变化
     * @param e - 输入事件
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * 切换密码显示/隐藏
     */
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    /**
     * 发送验证码到用户邮箱
     * 实现冷却机制防止频繁请求
     */
    const handleSendVerificationCode = async () => {
        if (!formData.email.includes('@')) {
            setError('请输入有效的邮箱地址');
            return;
        }

        // 防止重复点击
        if (isSending) return;

        setIsSending(true);
        setIsLoading(true);
        setError('');

        try {
            console.log(`尝试发送验证码到邮箱: ${formData.email}`);

            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: formData.email,
                    type: 'register' // 明确指定这是注册场景
                }),
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
     * 验证用户填写的基本信息是否有效
     * @returns {boolean} 验证结果
     */
    const validateInfo = () => {
        if (!formData.username.trim()) {
            setError('请输入用户名');
            return false;
        }
        
        if (!formData.email.includes('@')) {
            setError('请输入有效的邮箱地址');
            return false;
        }
        
        if (formData.password.length < 6) {
            setError('密码长度至少为6位');
            return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    /**
     * 验证验证码
     * 验证成功后进入确认步骤
     */
    const handleVerifyCode = async () => {
        if (!formData.verificationCode) {
            setError('请输入验证码');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 验证验证码
            console.log(`尝试验证验证码, 邮箱: ${formData.email}, 验证码: ${formData.verificationCode}`);
            const verifyResponse = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: formData.email, 
                    code: formData.verificationCode 
                }),
            });

            const verifyData = await verifyResponse.json();
            console.log('验证响应:', verifyData);

            if (!verifyResponse.ok) {
                throw new Error(verifyData.message || '验证码验证失败');
            }

            // 验证成功，进入确认步骤
            setIsVerified(true);
            setStep('confirm');
        } catch (error) {
            console.error('验证失败:', error);
            setError(error instanceof Error ? error.message : '验证码验证失败');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 处理最终注册提交
     * 验证成功后创建用户账户
     */
    const handleRegister = async () => {
        if (!isVerified) {
            setError('请先完成邮箱验证');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 执行注册
            console.log('提交注册请求');
            const registerResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const registerData = await registerResponse.json();
            console.log('注册响应:', registerData);

            if (!registerResponse.ok) {
                throw new Error(registerData.error || '注册失败');
            }

            // 注册成功，重定向到登录页
            router.push('/');
        } catch (error) {
            console.error('注册失败:', error);
            setError(error instanceof Error ? error.message : '注册过程中出现错误');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 处理下一步按钮点击
     * 验证基本信息并发送验证码
     */
    const handleNextStep = () => {
        if (validateInfo()) {
            handleSendVerificationCode();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        注册新账户
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        <span>已有账户？ </span>
                        <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                            返回登录
                        </Link>
                    </p>
                </div>

                {/* 步骤指示器 */}
                <div className="flex justify-between mb-8">
                    <div className={`flex-1 text-center ${step === 'info' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        1. 填写信息
                    </div>
                    <div className={`flex-1 text-center ${step === 'verify' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        2. 验证邮箱
                    </div>
                    <div className={`flex-1 text-center ${step === 'confirm' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        3. 确认创建
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}

                {/* 步骤1: 基本信息表单 */}
                {step === 'info' && (
                    <form className="mt-8 space-y-6">
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="username" className="sr-only">
                                    用户名
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="用户名"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    邮箱地址
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="邮箱地址"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">
                                    密码
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="密码（至少6位）"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />

                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="sr-only">
                                    确认密码
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="确认密码"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />

                            </div>
                        </div>

                        {/* 下一步按钮 */}
                        <div>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                disabled={isLoading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                    isLoading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {isLoading ? (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    </span>
                                ) : null}
                                {isLoading ? '请稍候...' : '下一步'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 步骤2: 验证码验证 */}
                {step === 'verify' && (
                    <div className="mt-8 space-y-6">
                        <div>
                            <div className="rounded-md shadow-sm">
                                <div className="relative">
                                    <label htmlFor="verificationCode" className="sr-only">
                                        验证码
                                    </label>
                                    <input
                                        id="verificationCode"
                                        name="verificationCode"
                                        type="text"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="请输入验证码"
                                        value={formData.verificationCode}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                验证码已发送至 {formData.email}
                            </p>
                        </div>

                        {/* 验证和返回按钮 */}
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setStep('info')}
                                disabled={isLoading}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                返回
                            </button>

                            <button
                                type="button"
                                onClick={handleVerifyCode}
                                disabled={isLoading || !formData.verificationCode}
                                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                    isLoading || !formData.verificationCode
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {isLoading ? (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    </span>
                                ) : null}
                                {isLoading ? '验证中...' : '验证'}
                            </button>
                        </div>

                        {/* 重新发送验证码按钮 */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                disabled={isLoading || countdown > 0 || isSending}
                                className={`text-sm font-medium ${
                                    isLoading || countdown > 0 || isSending
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-blue-600 hover:text-blue-500'
                                }`}
                            >
                                {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送验证码'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 步骤3: 确认创建账户 */}
                {step === 'confirm' && (
                    <div className="mt-8 space-y-6 text-black">
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">确认账户信息</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">用户名:</span>
                                    <span className="font-medium">{formData.username}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">邮箱:</span>
                                    <span className="font-medium">{formData.email}</span>
                                </div>
                                <div className="text-sm text-green-600 mt-2">
                                    ✓ 邮箱已验证
                                </div>
                            </div>
                        </div>

                        {/* 确认和返回按钮 */}
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setStep('verify')}
                                disabled={isLoading}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                返回
                            </button>

                            <button
                                type="button"
                                onClick={handleRegister}
                                disabled={isLoading}
                                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
                            >
                                {isLoading ? (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    </span>
                                ) : null}
                                {isLoading ? '创建中...' : '确认创建账户'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 服务条款和隐私政策 */}
                <div className="text-center text-gray-400 text-xs mt-6">
                    <span>注册即表示您同意我们的 </span>
                    <a href="#" className="text-blue-400 hover:underline">服务条款</a>
                    <span> 和 </span>
                    <a href="#" className="text-blue-400 hover:underline">隐私政策</a>。
                </div>
            </div>
        </div>
    );
}; 