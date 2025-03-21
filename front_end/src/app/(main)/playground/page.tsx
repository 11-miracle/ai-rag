"use client";

import { useSession } from "next-auth/react";
import ChatBox from "../../components/ChatBox";

export default function Playground() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to access the playground
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container  mx-auto px-4 py-8 ">
      <ChatBox />
    </div>
  );
} 