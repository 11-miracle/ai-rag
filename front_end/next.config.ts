import type {NextConfig} from "next";

const nextConfig = {
    images: {
        domains: ["www.gravatar.com"], // 允许加载的外部图片域名

        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // 如果使用 Google 登录
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;
