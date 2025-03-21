"use client";

import { useState, useRef } from 'react';

interface Message {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    isComplete?: boolean;
}

/**
 * 处理流式响应的自定义 Hook
 * @returns 处理流式响应所需的状态和方法
 */
export const useStreamResponse = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // 用于存储当前正在流式传输的消息的索引
    const streamingMessageIndexRef = useRef<number>(-1);
    // 用于存储当前消息的完整内容
    const currentMessageContentRef = useRef<string>("");

    /**
     * 更新消息内容和状态
     * @param content - 消息内容
     * @param isStreaming - 是否正在流式传输
     * @param isComplete - 是否完成传输
     */
    const updateMessage = (content: string, isStreaming: boolean, isComplete: boolean = false) => {
        setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            if (streamingMessageIndexRef.current !== -1) {
                newMessages[streamingMessageIndexRef.current] = {
                    role: "assistant" as const,
                    content,
                    isStreaming,
                    isComplete
                };
            }
            return newMessages;
        });
    };

    /**
     * 处理流式响应数据
     * @param reader - ReadableStreamDefaultReader 对象
     */
    const handleStreamResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
        try {
            currentMessageContentRef.current = "";
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // 完成时，设置 isComplete 为 true
                    updateMessage(currentMessageContentRef.current, false, true);
                    break;
                }

                // 将接收到的数据块解码为文本
                const chunk = new TextDecoder().decode(value);
                currentMessageContentRef.current += chunk;
                
                // 更新消息内容，保持流式状态，但标记为未完成
                updateMessage(currentMessageContentRef.current, true, false);
            }
        } catch (error) {
            console.error('Stream processing error:', error);
            updateMessage("抱歉，处理响应时出现错误。", false, true);
        } finally {
            setIsLoading(false);
            streamingMessageIndexRef.current = -1;
            currentMessageContentRef.current = "";
        }
    };

    /**
     * 发送消息并处理响应
     * @param userMessage - 用户输入的消息
     */
    const sendMessage = async (userMessage: string) => {
        if (!userMessage.trim() || isLoading) return;

        setIsLoading(true);
        // 添加用户消息
        setMessages(prev => [...prev, { role: "user" as const, content: userMessage }]);

        try {
            // 创建助手消息占位符
            setMessages(prev => {
                const newMessages = [...prev, {
                    role: "assistant" as const,
                    content: "",
                    isStreaming: true,
                    isComplete: false
                }];
                streamingMessageIndexRef.current = newMessages.length - 1;
                return newMessages;
            });

            const response = await fetch(`http://192.168.105.36:8000/chatbot?query=${encodeURIComponent(userMessage)}`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.body) {
                const reader = response.body.getReader();
                await handleStreamResponse(reader);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                if (streamingMessageIndexRef.current !== -1) {
                    newMessages[streamingMessageIndexRef.current] = {
                        role: "assistant" as const,
                        content: "抱歉，处理您的请求时出现错误。",
                        isStreaming: false,
                        isComplete: true
                    };
                }
                return newMessages;
            });
            setIsLoading(false);
            streamingMessageIndexRef.current = -1;
        }
    };

    return {
        messages,
        isLoading,
        sendMessage,
        setMessages
    };
}; 