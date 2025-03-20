import { useCallback, useEffect, useRef, useState } from "react";

/// lib/hooks/use-scroll.ts 修改
export default function useScroll(threshold :number) {
  const [scrolled, setScrolled] = useState(false);
  const rafId = useRef<number>();
  const lastY = useRef(0);

  useEffect(() => {
    const handler = () => {
      const currentY = window.scrollY;
      
      // 添加滚动方向判断
      if (Math.abs(currentY - lastY.current) < 5) return;
      
      cancelAnimationFrame(rafId.current!);
      rafId.current = requestAnimationFrame(() => {
        setScrolled(currentY > threshold);
        lastY.current = currentY; // 更新最后记录位置
      });
    };
    
    const debouncedHandler = debounce(handler, 100); // 增加防抖时间
    window.addEventListener("scroll", debouncedHandler, { passive: true });
    
    return () => {
      cancelAnimationFrame(rafId.current!);
      window.removeEventListener("scroll", debouncedHandler);
    };
  }, [threshold]);

  return scrolled;
}

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// export default function useScroll(threshold: number) {
//   const [scrolled, setScrolled] = useState(false);

//   const onScroll = useCallback(() => {
//     setScrolled(window.pageYOffset > threshold);
//   }, [threshold]);

//   useEffect(() => {
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, [onScroll]);

//   return scrolled;
// }
