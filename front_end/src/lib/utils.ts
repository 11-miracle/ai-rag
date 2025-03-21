/**
 * 生成指定长度的随机验证码
 * @param length - 验证码长度，默认为6
 * @returns 生成的验证码
 */
export function generateVerificationCode(length: number = 6): string {
    return Math.random()
        .toString()
        .slice(2, 2 + length);
}

/**
 * 验证密码强度
 * @param password - 待验证的密码
 * @returns 是否符合密码强度要求
 */
export function validatePassword(password: string): boolean {
    // 简化为只验证密码长度至少6位
    return password.length >= 6;
}

/**
 * 验证邮箱格式
 * @param email - 待验证的邮箱
 * @returns 是否是有效的邮箱格式
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @returns 生成的随机字符串
 */
export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
} 