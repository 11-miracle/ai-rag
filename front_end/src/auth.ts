import NextAuth, { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs'; // 导入bcrypt模块
// import { PrismaClient } from "@prisma/client";
// import { PrismaAdapter } from "@auth/prisma-adapter";

// const prisma = new PrismaClient();

// 扩展 User 类型以包含 provider 属性
interface CustomUser extends User {
  provider?: string;
  permission: 'admin' | 'user' | 'banned'; // 添加权限字段
}

// 扩展 Session 类型以包含自定义用户属性
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: CustomUser; // 确保 user 属性类型一致
  }
}

// 自定义用户数据结构
interface UserData {
  id: number; // 现在是整数类型
  username: string;
  email: string;
  password: string;
  permission: 'admin' | 'user' | 'banned';
}

// 配置 NextAuth
const config: NextAuthConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('请提供邮箱和密码');
          }

          // 查询用户
          const users = await query(
            'SELECT id, username, email, password, permission FROM Users WHERE email = ?',
            [credentials.email]
          ) as UserData[];

          if (users.length === 0) {
            throw new Error('用户不存在');
          }

          const user = users[0];

          // 验证密码 - 使用bcrypt比较哈希密码
          // 确保是字符串类型
          if (typeof credentials.password !== 'string' || typeof user.password !== 'string') {
            throw new Error('密码数据类型错误');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error('密码错误');
          }

          // 生成默认头像URL（如果需要）
          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`;

          // 返回用户信息（不包含密码）
          return {
            id: user.id.toString(), // 将整数ID转换为字符串
            name: user.username || '', // 确保 name 不为 undefined
            email: user.email || '', // 确保 email 不为 undefined
            image: avatarUrl || '', // 确保 image 不为 undefined
            permission: user.permission || 'user' // 确保 permission 不为 undefined
          };
        } catch (error: any) {
          throw new Error(error.message || '登录失败');
        }
      }
    })
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id || '';
        token.name = user.name || '';
        token.email = user.email || '';
        token.picture = user.image || '';
        token.permission = user.permission || 'user'; // 确保 permission 不为 undefined
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.permission = token.permission;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  // adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
} as const;

// 导出配置的 auth 处理程序
export const { handlers, auth, signIn, signOut } = NextAuth(config);

// 导出配置供其他地方使用
export const authConfig = config;