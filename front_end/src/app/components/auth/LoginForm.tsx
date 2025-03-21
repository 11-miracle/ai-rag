"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaGithub, FaGoogle } from 'react-icons/fa';

/**
 * 登录表单组件
 * 包含密码登录和社交媒体登录功能
 */
export const LoginForm = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    /**
     * 处理登录表单提交
     * @param e - 表单提交事件
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            // 登录成功，重定向到主页或仪表板
            router.push('/playground');
            router.refresh(); // 刷新页面以更新 session 状态
        } catch (error: any) {
            setError(error.message || '登录过程中出现错误');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 处理社交媒体登录
     * @param provider - 社交媒体提供商
     */
    const handleSocialSignIn = (provider: string) => {
        signIn(provider, { callbackUrl: '/playground' });
    };

    /**
     * 处理表单输入变化
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

    return (
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        登录
                    </h2>
                </div>
                
                {/* 社交媒体登录按钮 */}
                <div className="flex flex-col space-y-4">
                    <button
                        type="button"
                        onClick={() => handleSocialSignIn('github')}
                        className="bg-gray-500 text-white py-2 rounded-full flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors"
                    >
                        <FaGithub className="h-5 w-5" />
                        <span>GitHub 登录</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSocialSignIn('google')}
                        className="bg-blue-300 text-white py-2 rounded-full flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
                    >
                        <FaGoogle className="h-5 w-5" />
                        <span>Google 登录</span>
                    </button>
                    
                    <div className="text-center text-gray-500">或使用邮箱登录</div>
                </div>
                
                {/* 错误消息 */}
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}
                
                {/* 登录表单 */}
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">
                            邮箱地址
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
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
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
                            placeholder="密码"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                            onClick={togglePasswordVisibility}
                        >
                            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="text-right text-sm">
                        <Link
                            href="/auth/forgot-password"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            忘记密码？
                        </Link>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                isLoading
                                    ? 'bg-blue-600'
                                    : 'bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-600 hover:to-indigo-700'
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
                            {isLoading ? '登录中...' : '登录'}
                        </button>
                    </div>
                </form>
                
                <div className="text-center text-gray-500 mt-4">
                    <span>没有账户？ </span>
                    <Link
                        href="/auth/register"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        注册新账户
                    </Link>
                </div>
                
                <div className="text-center text-gray-400 text-xs mt-6">
                    <span>继续使用即表示您同意我们的 </span>
                    <a href="#" className="text-blue-400 hover:underline">服务条款</a>
                    <span> 和 </span>
                    <a href="#" className="text-blue-400 hover:underline">隐私政策</a>。
                </div>
            </div>
    );
}; 