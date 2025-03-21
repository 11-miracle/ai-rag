'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/auth/AuthGuard';

/**
 * 用户管理页面
 * 用于管理员添加/管理用户
 */
export default function UsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    permission: 'user' as 'admin' | 'user' | 'banned'
  });

  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 处理添加用户表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('添加用户请求:', { ...formData, password: '***' });

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加用户失败');
      }

      console.log('添加用户成功:', data);
      setMessage({ type: 'success', text: '用户添加成功' });
      
      // 重置表单
      setFormData({
        username: '',
        email: '',
        password: '',
        permission: 'user'
      });
    } catch (error) {
      console.error('添加用户失败:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '添加用户过程中出现错误' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 表单字段定义
  const formFields = [
    {
      id: 'username',
      name: 'username',
      type: 'text',
      label: '用户名',
      required: true
    },
    {
      id: 'email',
      name: 'email',
      type: 'email',
      label: '邮箱',
      required: true
    },
    {
      id: 'password',
      name: 'password',
      type: 'password',
      label: '密码',
      required: true
    }
  ];

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl text-black font-bold">用户管理</h1>
          <button 
            onClick={() => router.push('/console')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            返回控制台
          </button>
        </div>

        {/* 添加用户表单 */}
        <div className="bg-white text-black rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">添加新用户</h2>
          
          {message && (
            <div className={`rounded-md p-4 mb-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 动态生成表单字段 */}
            {formFields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData[field.name as keyof typeof formData] as string}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            ))}
            
            {/* 权限选择下拉框 */}
            <div>
              <label htmlFor="permission" className="block text-sm font-medium text-gray-700 mb-1">
                权限
              </label>
              <select
                id="permission"
                name="permission"
                className="w-1/5 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.permission}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
                <option value="banned">已封禁</option>
              </select>
            </div>
            
            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-blue-200 cursor-not-allowed'
                    : 'bg-blue-400 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300`}
              >
                {isLoading ? '添加中...' : '添加用户'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
} 