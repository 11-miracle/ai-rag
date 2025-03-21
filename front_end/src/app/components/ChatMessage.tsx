"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {ReactNode} from 'react';

// 定义消息类型接口
interface Message {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    isComplete?: boolean;
}

// 定义组件属性接口
interface ChatMessageProps {
    message: Message;
}

interface CodeProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: ReactNode;
}

interface TableProps {
    children?: ReactNode;
}

interface LinkProps {
    children?: ReactNode;
    href?: string;
}

/**
 * ChatMessage 组件
 * 用于显示单条聊天消息，支持 Markdown 格式化
 * @param message - 消息对象，包含角色和内容
 */
export const ChatMessage = ({message}: ChatMessageProps) => {
    const isAssistant = message.role === "assistant";

    // 渲染助手消息的内容
    const renderAssistantContent = () => {
        // 如果消息未完成，直接显示纯文本
        if (!message.isComplete) {
            return (
                <div className="whitespace-pre-wrap break-words">
                    {message.content}
                </div>
            );
        }

        // 消息完成后，使用 Markdown 渲染
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // 自定义代码块样式
                    code({node, inline, className, children, ...props}: CodeProps) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="not-prose relative my-4">
                                <div className="absolute right-2 top-2 text-xs text-gray-400">
                                    {match[1]}
                                </div>
                                <pre className={`${className} rounded-md p-4 bg-gray-800 overflow-x-auto`}>
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="bg-gray-100 rounded-sm px-1" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // 自定义表格样式
                    table({children}: TableProps) {
                        return (
                            <div className="not-prose overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-gray-200">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    // 自定义链接样式
                    a({children, href}: LinkProps) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {message.content}
            </ReactMarkdown>
        );
    };

    return (
        <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} my-4`}>
            <div className={`max-w-[80%] rounded-lg shadow p-4 ${
                isAssistant ? 'bg-white text-gray-800' : 'bg-blue-500 text-white'
            }`}>
                <div className={isAssistant ? 'prose dark:prose-invert prose-sm max-w-none' : 'whitespace-pre-wrap break-words'}>
                    {isAssistant ? (
                        <>
                            {renderAssistantContent()}
                            {message.isStreaming && (
                                <span className="inline-flex ml-2">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"/>
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150 mx-1"/>
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-300"/>
                                </span>
                            )}
                        </>
                    ) : (
                        message.content
                    )}
                </div>
            </div>
        </div>
    );
}; 