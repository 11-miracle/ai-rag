"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">
          {error === "Configuration"
            ? "There was a problem with the authentication configuration. Please try again later or contact support."
            : "An error occurred during authentication."}
        </p>
        <div className="flex justify-center">
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 