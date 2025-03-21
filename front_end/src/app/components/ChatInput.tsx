"use client";

import { useRef } from "react";

// 定义组件属性接口
interface ChatInputProps {
    input: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * ChatInput 组件
 * 处理聊天输入和文件上传功能
 */
export const ChatInput = ({
    input,
    isLoading,
    onInputChange,
    onSubmit,
    onFileUpload,
}: ChatInputProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <form onSubmit={onSubmit} className="p-4 bg-white rounded-b-lg shadow">
            <div className="flex space-x-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-black"
                    disabled={isLoading}
                />
                {/*<button*/}
                {/*    type="button"*/}
                {/*    onClick={() => fileInputRef.current?.click()}*/}
                {/*    className="px-4 py-2 bg-gray-200 text-white rounded-lg hover:bg-gray-500 transition-colors"*/}
                {/*    disabled={isLoading}*/}
                {/*>*/}
                {/*    Upload*/}
                {/*</button>*/}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileUpload}
                    className="hidden"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-200 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    disabled={isLoading}
                >
                    Send
                </button>
            </div>
        </form>
    );
}; 