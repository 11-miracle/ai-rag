"use client";
import { useState } from "react";
import { FileUpload } from "@/app/components/FileUpload";

// 定义上传类型
type UploadType = "file" | "text" | "url";

export default function Source() {
  // 当前选中的上传类型
  const [selectedType, setSelectedType] = useState<UploadType>("file");

  // 定义上传类型选项
  const uploadTypes = [
    { id: "file" as UploadType, label: "文件上传", icon: "📄" },
    { id: "text" as UploadType, label: "文本输入", icon: "📝" },
    { id: "url" as UploadType, label: "URL链接", icon: "🔗" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 左侧功能栏 */}
      <div className="w-40 bg-white p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-500">上传类型</h2>
        <div className="space-y-2">
          {uploadTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                selectedType === type.id
                  ? "bg-gray-300 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 中间内容区域 */}
      <div className="flex-1 p-6">
        {selectedType === "file" && <FileUpload />}
        {selectedType === "text" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">文本输入功能开发中...</p>
          </div>
        )}
        {selectedType === "url" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">URL链接功能开发中...</p>
          </div>
        )}
      </div>
    </div>
  );
}