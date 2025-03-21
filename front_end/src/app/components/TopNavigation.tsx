"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

// 默认头像配置
const DEFAULT_AVATAR = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23718096'/%3E%3C/svg%3E",
  size: 32,
};

export const TopNavigation = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 定义导航链接数组
  const navLinks = [
    { href: "/playground", label: "playground" },
    { href: "/source", label: "source" },
    { href: "/history", label: "history" },
    { href: "/setting", label: "setting" },
  ];

  // 处理登出
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" }); // 登出后重定向到首页
  };

  // 检查用户是否为管理员
  const isAdmin = session?.user?.permission === 'admin';

  return (
    <nav className="flex justify-between items-center px-4 py-0">
      {/* 左侧占位，保证中间导航可以居中 */}
      <div className="w-32"></div>

      {/* 中间导航链接 */}
      <div className="flex-grow flex justify-center space-x-6">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? "font-bold text-gray-900" : "text-gray-400"}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 右侧用户信息和登出按钮 */}
      <div className="flex items-center">
        {status === "authenticated" && session?.user && (
          <div className="flex items-center space-x-4">
            {/* 管理员控制台按钮 */}
            {isAdmin && (
              <Link 
                href="/console"
                className={`text-sm font-medium ${
                  pathname === '/console'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } px-3 py-2 rounded-md transition-colors`}
              >
                管理控制台
              </Link>
            )}

            {/* 用户头像 */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={session.user.image ?? DEFAULT_AVATAR.src} // 更安全的头像回退处理
                alt={session.user.name ?? "用户头像"}
                width={DEFAULT_AVATAR.size}
                height={DEFAULT_AVATAR.size}
                className="rounded-full"
                unoptimized // 允许加载外部图片
              />
            </div>

            {/* 用户名 */}
            <span className="text-gray-500">{session.user.name ?? "未命名用户"}</span>

            {/* 登出按钮 */}
            <button
              onClick={handleSignOut}
              className="bg-gray-300 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
            >
              登出
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
