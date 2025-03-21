"use client";

import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {query} from "@/lib/db";

// 定义最大文件大小（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const FileUpload = () => {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件选择
    const handleFileSelect = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            alert('文件大小超过10MB限制！');
            router.refresh(); // 刷新页面
            return;
        }
        setSelectedFile(file);
        setFileSize(file.size);
    };

    // 处理文件输入变化
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // 处理拖拽开始
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUploading) {
            setIsDragging(true);
        }
    };

    // 处理拖拽结束
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // 处理拖放
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isUploading) return; // 如果正在上传，不接受新文件

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // 格式化文件大小显示
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 处理文件上传
    const handleUpload = async () => {
        if (!selectedFile || isUploading) return; // 防止重复上传

        setIsUploading(true); // 设置上传状态

        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append("file", selectedFile, selectedFile.name); // 确保文件名不变
            }
            formData.append("query", "请总结这个文档的主要内容"); // 确保 query 作为字符串参数传递

            const response = await fetch("http://192.168.105.36:8000/analyze", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log("上传成功:", result);

                // 生成消息并存储到 localStorage
                const welcomeMessage = {
                    role: 'assistant',
                    content: `已收到${selectedFile.name}文件，大小${formatFileSize(fileSize)}`
                };
                localStorage.setItem('chatMessages', JSON.stringify([welcomeMessage]));

                router.push("/playground");
            } else {
                throw new Error(`上传失败: ${response.status}`);
            }
        } catch (error) {
            alert("文件上传失败，请重试！");
            console.error("Upload error:", error);
            router.push("/source");
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
            setFileSize(0);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            {/* 文件上传区域 */}
            <div
                className={`w-full h-56 p-8 border-2 border-dashed rounded-lg 
                    ${isDragging && !isUploading ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                    ${selectedFile ? 'bg-green-50' : 'bg-gray-50'}  
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <div className="text-center">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        disabled={isUploading}
                    />
                    <p className="mb-2 text-sm text-gray-500">
                        {isUploading ? (
                            <span className="font-semibold">文件上传中...</span>
                        ) : selectedFile ? (
                            <>
                                已选择文件: <span className="font-semibold">{selectedFile.name}</span>
                            </>
                        ) : (
                            <>
                                <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                            </>
                        )}
                    </p>
                    <p className="text-xs text-gray-500">支持所有文本类型文件</p>
                </div>
            </div>

            {/* 文件大小显示 */}
            <div className="mt-4 text-sm text-gray-600">
                {selectedFile && (
                    <div className="flex items-center space-x-2">
                        <span>文件大小：</span>
                        <span className={fileSize > MAX_FILE_SIZE ? 'text-red-500' : 'text-green-500'}>
                            {formatFileSize(fileSize)}
                        </span>
                        <span className="text-gray-400">
                            (最大限制: {formatFileSize(MAX_FILE_SIZE)})
                        </span>
                    </div>
                )}
            </div>

            {/* 上传按钮 */}
            <button
                onClick={handleUpload}
                disabled={!selectedFile || fileSize > MAX_FILE_SIZE || isUploading}
                className={`mt-4 px-6 py-2 rounded-md text-white transition-colors
                    ${!selectedFile || fileSize > MAX_FILE_SIZE || isUploading
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-blue-300 hover:bg-blue-500'
                }`}
                style={{cursor: isUploading ? 'not-allowed' : 'pointer'}}
            >
                {isUploading ? '上传中...' : '上传文件'}
            </button>
        </div>
    );
}; 