'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

// 公共路由列表，这些路由不需要权限验证
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/auth/forgot-password'];

/**
 * 权限验证中间件组件
 * 用于验证用户登录状态和权限
 * 处理不同权限用户的访问控制
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  
  // 检查当前路径是否是公共路由
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // 如果是公共路由，直接允许访问
    if (isPublicRoute) {
      setIsAuthorized(true);
      return;
    }

    // 如果正在加载，不执行任何操作
    if (status === 'loading') return;

    // 如果未登录，重定向到登录页
    if (status === 'unauthenticated') {
      console.log('用户未登录，重定向到登录页');
      router.push('/');
      return;
    }

    // 如果已登录，检查用户权限
    if (session?.user) {
      const userPermission = session.user.permission;
      console.log('当前用户权限:', userPermission);

      // 根据权限执行相应操作
      switch (userPermission) {
        case 'banned':
          // 被拉黑用户显示提示
          console.log('用户已被拉黑，进行拦截');
          toast.error('您已被拉黑');
          // 仅当不在公共路由时重定向
          if (!isPublicRoute) {
            router.push('/error');
          }
          setIsAuthorized(false);
          break;
        case 'admin':
          // admin用户允许访问所有页面
          console.log('管理员用户，允许访问');
          setIsAuthorized(true);
          break;
        case 'user':
          // 普通用户允许访问所有页面
          console.log('普通用户，允许访问');
          setIsAuthorized(true);
          break;
        default:
          // 未知权限
          console.log('未知权限用户');
          setIsAuthorized(false);
          // 仅当不在公共路由时重定向
          if (!isPublicRoute) {
            router.push('/error');
          }
      }
    }
  }, [session, status, router, pathname, isPublicRoute]);

  // 如果是公共路由，直接显示内容
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 如果正在加载，显示加载状态
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 如果未登录或未授权，不显示内容
  if (status === 'unauthenticated' || (!isAuthorized && session?.user?.permission === 'banned')) {
    return null;
  }

  // 如果已登录且已授权，显示子组件
  return <>{children}</>;
} 