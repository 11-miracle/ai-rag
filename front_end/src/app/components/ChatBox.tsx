"use client";

import {useState, useRef, useEffect} from "react";
import {useSession} from "next-auth/react";
import {ChatMessage} from "./ChatMessage";
import {ChatInput} from "./ChatInput";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useStreamResponse } from "../hooks/useStreamResponse";

interface Message {
    role: "user" | "assistant";
    content: string;
    // 新增字段，用于标识消息是否正在流式传输中
    isStreaming?: boolean;
}

/**
 * ChatBox 组件
 * 主聊天界面，包含消息显示和输入功能
 */
export default function ChatBox() {
    const { messages, isLoading, sendMessage, setMessages } = useStreamResponse();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {data: session} = useSession();

    /**
     * 初始化加载消息
     * 从 localStorage 获取之前存储的消息
     */
    useEffect(() => {
        const storedMessages = localStorage.getItem('chatMessages');
        if (storedMessages) {
            try {
                const parsedMessages = JSON.parse(storedMessages);
                setMessages(prev => [...prev, ...parsedMessages]);
                localStorage.removeItem('chatMessages');
            } catch (error) {
                console.error('Error parsing stored messages:', error);
            }
        }
    }, [setMessages]);

    /**
     * 自动滚动到最新消息
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * 处理消息提交
     * @param e - 表单提交事件
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        await sendMessage(userMessage);
    };

    /**
     * 处理文件上传
     * @param e - 文件输入事件
     */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        console.log("File selected:", file);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
            {/* 消息显示区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg border-2 border-gray-300">
                {messages.map((message, index) => (
                    <ChatMessage 
                        key={index} 
                        message={{
                            ...message,
                            // 如果是最后一条消息且正在加载，则显示动画
                            isStreaming: message.isStreaming && index === messages.length - 1
                        }} 
                    />
                ))}
                <div ref={messagesEndRef}/>
            </div>

            {/* 输入区域 */}
            <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                // onFileUpload={handleFileUpload}
            />
        </div>
    );
} 