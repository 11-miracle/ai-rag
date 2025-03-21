/**
 * 重置密码表单组件
 * 用于输入新密码和确认密码
 */
"use client";

interface ResetPasswordFormProps {
    onResetPassword: () => Promise<void>;
    newPassword: string;
    setNewPassword: (password: string) => void;
    confirmPassword: string;
    setConfirmPassword: (password: string) => void;
    isLoading: boolean;
    error: string;
}

/**
 * 重置密码表单组件
 * 处理密码重置
 */
export const ResetPasswordForm = ({ 
    onResetPassword, 
    newPassword, 
    setNewPassword, 
    confirmPassword, 
    setConfirmPassword, 
    isLoading,
    error
}: ResetPasswordFormProps) => {
    return (
        <div>
            {error && (
                <div className="text-red-500 text-sm text-center mb-4">
                    {error}
                </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="newPassword" className="sr-only">
                        新密码
                    </label>
                    <input
                        id="newPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="请输入新密码（至少6位）"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="sr-only">
                        确认密码
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="请确认新密码"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="mt-4">
                <button
                    type="button"
                    onClick={onResetPassword}
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading || !newPassword || !confirmPassword
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                    {isLoading ? '提交中...' : '重置密码'}
                </button>
            </div>
        </div>
    );
}; 