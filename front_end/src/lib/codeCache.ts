/**
 * 验证码缓存模块
 * 使用内存缓存代替数据库存储验证码
 */

interface VerificationCodeEntry {
  code: string;
  expiresAt: number; // Unix时间戳，表示过期时间
}

// 声明全局变量类型
declare global {
  var codeCache: Map<string, VerificationCodeEntry>;
}

// 全局缓存对象，确保在开发模式下的热重载不会清除验证码
// 使用全局对象保存 codeCache，防止NextJS开发环境中的函数重新执行时丢失
if (!global.codeCache) {
  global.codeCache = new Map<string, VerificationCodeEntry>();
  console.log('创建全局验证码缓存');
}

// 获取全局缓存对象的引用
const codeCache = global.codeCache;

/**
 * 存储验证码到缓存
 * @param email - 用户邮箱
 * @param code - 验证码
 * @param expiresInSeconds - 过期时间（秒），默认为120秒（2分钟）
 */
export function storeVerificationCode(
  email: string, 
  code: string, 
  expiresInSeconds: number = 120
): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  
  codeCache.set(email, {
    code,
    expiresAt
  });
  
  console.log(`存储验证码: ${email} -> ${code}, 过期时间: ${new Date(expiresAt).toLocaleString()}`);
  
  // 设置过期后自动从缓存中删除
  setTimeout(() => {
    // 检查是否是同一个验证码实例（防止用户在过期前重新请求新码）
    const entry = codeCache.get(email);
    if (entry && entry.expiresAt === expiresAt) {
      codeCache.delete(email);
      console.log(`验证码已过期并从缓存中移除: ${email}`);
    }
  }, expiresInSeconds * 1000);
}

/**
 * 验证验证码是否有效
 * @param email - 用户邮箱
 * @param code - 待验证的验证码
 * @returns 验证结果，true表示验证通过，false表示验证失败
 */
export function verifyCode(email: string, code: string): boolean {
  const entry = codeCache.get(email);
  
  console.log(`验证码验证: ${email}, 用户输入: ${code}, 缓存中的验证码: ${entry?.code}, 过期时间: ${entry ? new Date(entry.expiresAt).toLocaleString() : '无'}`);
  
  // 没有找到验证码记录或验证码已过期
  if (!entry || entry.expiresAt < Date.now()) {
    console.log(`验证失败: ${!entry ? '未找到验证码' : '验证码已过期'}`);
    return false;
  }
  
  // 验证码不匹配
  if (entry.code !== code) {
    console.log(`验证失败: 验证码不匹配`);
    return false;
  }
  
  // 验证成功后删除验证码（一次性使用）
  codeCache.delete(email);
  console.log(`验证成功，已从缓存中删除验证码: ${email}`);
  
  return true;
}

/**
 * 检查邮箱是否存在有效的验证码
 * @param email - 用户邮箱
 * @returns 是否存在有效验证码
 */
export function hasActiveCode(email: string): boolean {
  const entry = codeCache.get(email);
  const isActive = !!entry && entry.expiresAt > Date.now();
  console.log(`检查是否存在活跃的验证码: ${email}, 结果: ${isActive ? '是' : '否'}`);
  return isActive;
}

/**
 * 获取验证码剩余有效时间（秒）
 * @param email - 用户邮箱
 * @returns 剩余有效时间（秒），如果验证码不存在或已过期则返回0
 */
export function getCodeRemainingTime(email: string): number {
  const entry = codeCache.get(email);
  
  if (!entry || entry.expiresAt < Date.now()) {
    return 0;
  }
  
  return Math.ceil((entry.expiresAt - Date.now()) / 1000);
}

// 调试功能：列出所有当前验证码
export function debugListAllCodes(): void {
  console.log('当前缓存中的所有验证码:');
  codeCache.forEach((entry, email) => {
    console.log(`邮箱: ${email}, 验证码: ${entry.code}, 过期时间: ${new Date(entry.expiresAt).toLocaleString()}`);
  });
} 