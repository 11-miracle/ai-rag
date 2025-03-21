/**
 * 邮箱表单组件
 * 用于输入邮箱和发送验证码
 */
"use client";

import { useState } from 'react';

interface EmailFormProps {
    onSendCode: (email: string) => Promise<void>;
    email: string;
    setEmail: (email: string) => void;
    isLoading: boolean;
    isSending: boolean;
    countdown: number;
    error: string;
}

/**
 * 邮箱表单组件
 * 处理邮箱输入和发送验证码
 */
export const EmailForm = ({ 
    onSendCode, 
    email, 
    setEmail, 
    isLoading, 
    isSending, 
    countdown,
    error 
}: EmailFormProps) => {
    /**
     * 处理发送验证码
     */
    const handleSendVerificationCode = async () => {
        if (!email || !email.includes('@')) {
            return;
        }
        await onSendCode(email);
    };

    return (
        <div>
            {error && (
                <div className="text-red-500 text-sm text-center mb-4">
                    {error}
                </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="email" className="sr-only">
                        邮箱地址
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="请输入您的邮箱地址"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isLoading || !email || isSending || !email.includes('@')}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading || !email || isSending || !email.includes('@')
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                    {isLoading ? '发送中...' : countdown > 0 ? `${countdown}秒后重新发送` : '发送验证码'}
                </button>
            </div>
        </div>
    );
}; 