'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 控制台布局
 * 包含管理员权限验证
 */
export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 验证用户是否有管理员权限
  useEffect(() => {
    // 等待会话加载完成
    if (status === 'loading') return;

    // 验证权限
    if (status === 'unauthenticated' || session?.user?.permission !== 'admin') {
      console.log('非管理员尝试访问控制台:', session?.user);
      toast.error('需要管理员权限');
      router.push('/');
    }
  }, [session, status, router]);

  // 如果正在加载会话或者确认是管理员，显示内容
  if (status === 'loading' || (status === 'authenticated' && session?.user?.permission === 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        {status === 'loading' ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }

  // 默认不渲染内容（非管理员）
  return null;
} 