"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginForm } from './components/auth/LoginForm';

/**
 * 根页面组件
 * 显示所有登录选项，包括第三方登录和密码登录
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/playground");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">

            <LoginForm />
          </div>

  );
}