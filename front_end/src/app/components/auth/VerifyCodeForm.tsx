/**
 * 验证码验证表单组件
 * 用于验证码验证
 */
"use client";

interface VerifyCodeFormProps {
    onVerifyCode: () => Promise<void>;
    onResendCode: () => Promise<void>;
    verificationCode: string;
    setVerificationCode: (code: string) => void;
    isLoading: boolean;
    isSending: boolean;
    countdown: number;
    error: string;
}

/**
 * 验证码验证表单组件
 * 处理验证码验证和重新发送
 */
export const VerifyCodeForm = ({ 
    onVerifyCode, 
    onResendCode, 
    verificationCode, 
    setVerificationCode, 
    isLoading, 
    isSending, 
    countdown,
    error
}: VerifyCodeFormProps) => {
    return (
        <div>
            {error && (
                <div className="text-red-500 text-sm text-center mb-4">
                    {error}
                </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="code" className="sr-only">
                        验证码
                    </label>
                    <input
                        id="code"
                        type="text"
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="请输入验证码"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <button
                    type="button"
                    onClick={onVerifyCode}
                    disabled={isLoading || !verificationCode}
                    className={`flex-1 mr-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading || !verificationCode
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                    {isLoading ? '验证中...' : '验证'}
                </button>
                <button
                    type="button"
                    onClick={onResendCode}
                    disabled={isLoading || countdown > 0 || isSending}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                        isLoading || countdown > 0 || isSending
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-white text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                    {countdown > 0 ? `${countdown}秒后重新发送` : isSending ? '发送中...' : '重新发送'}
                </button>
            </div>
        </div>
    );
}; 