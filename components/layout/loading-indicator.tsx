"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// 创建一个内部组件来使用 useSearchParams
function LoadingIndicatorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 路由变化时显示加载状态
    setIsLoading(true);
    
    // 设置一个超时，如果加载时间过长，也隐藏加载指示器
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      setIsLoading(false);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center">
      <div className="flex space-x-2 p-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" style={{ animationDelay: "0.2s" }}></div>
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  );
}

// 导出一个包含 Suspense 的组件
export function LoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <LoadingIndicatorInner />
    </Suspense>
  );
}
