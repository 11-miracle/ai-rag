'use client';

import Link from 'next/link';
import AuthGuard from '../components/auth/AuthGuard';
import { useRouter } from 'next/navigation';

/**
 * 控制台页面
 * 仅管理员可访问
 */
export default function ConsolePage() {
  // 管理功能列表
  const adminFeatures = [
    { 
      title: '新增用户',
      description: '自定义新增用户并控制权限',
      icon: '👥', 
      link: '/console/users' 
    },
    { 
      title: '系统设置', 
      description: '配置系统参数和全局设置', 
      icon: '⚙️', 
      link: '/console/settings' 
    },
    // 后续可添加更多管理功能
  ];
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl  text-black font-bold mb-6">管理控制台</h1>
          <button
            onClick={() => router.push('/playground')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            返回playground
          </button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => (
            <Link 
              key={index} 
              href={feature.link}
              className="block bg-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start">
                <div className="text-3xl mr-4">{feature.icon}</div>
                <div>
                  <h3 className="text-xl text-black font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
} 