"use client";

import { cn } from "@/lib/utils";

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-neutral-800/50", className)}
            {...props}
        />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-3 w-[60px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="w-5 h-5 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
