"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        // Signup is no longer needed. Redirect to login for API Key authentication.
        router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-neutral-400 mb-4">注册功能已迁移至 API Key 认证</p>
                <p className="text-neutral-500 text-sm">正在跳转至登录页面...</p>
            </div>
        </div>
    );
}
