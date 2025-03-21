"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
// import { FiMenu, FiX } from "react-icons/fi"; // 引入图标

export const SideNavigation = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  // 控制侧边栏展开/收起状态
  const [isExpanded, setIsExpanded] = useState();

  // 定义导航链接数组
  const navLinks = [
    // Ultra 功能导航
    { href: "/aidb", label: "AiDB", icon: "📈" },
    { href: "/audio", label: "Audio", icon: "🎵" },
    { href: "/ocr", label: "OCR", icon: "📷" },
    { href: "/ragai", label: "RAG", icon: "🔎" },
  ];

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white text-black transition-all duration-300 border border-gray-100 ${
        isExpanded ? "w-45" : "w-16"  // 根据展开状态设置宽度
      } shadow-lg z-40`}
    >
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        // className="absolute right-[-12px] top-4 bg-gray-700 rounded-full p-2 hover:bg-gray-600 shadow-md"
        className="absolute right-[-0px] top-4  rounded-full p-2 hover:bg-gray-600 shadow-md"
      >
        {/*{isExpanded ? <FiX size={20} /> : <FiMenu size={20} />}*/}
        {isExpanded ? "⬅" : "➡"}

      </button>

      {/* 导航链接列表 */}
      <div className="pt-16 space-y-2">
        {/* 主要功能区域 */}
        <div className="px-4 py-2">
          {isExpanded && <div className="text-xs text-gray-800 mb-2">进阶功能</div>}
          {navLinks.slice(0, 4).map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 rounded-lg mb-1 ${
                pathname === href
                  ? "bg-gray-400 text-balck"
                  : "text-gray-500 hover:bg-gray-500"
              } ${isExpanded ? "justify-start" : "justify-center"} transition-colors duration-200`}
            >
              <span className="text-xl">{icon}</span>
              {isExpanded && <span className="ml-3 text-sm">{label}</span>}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};