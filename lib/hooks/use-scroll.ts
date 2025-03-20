import { useEffect, useRef } from "react";

export default function useScroll(threshold: number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    
    const handler = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (!ref.current) return;        
       
        const blur = currentY > threshold ? 'blur(12px)' : 'blur(0)'; // 超过阈值时模糊        
        ref.current.style.backgroundColor = 'transparent'; // 背景透明度
        ref.current.style.backdropFilter = blur; // 模糊效果        
        rafId = 0;
      });
    };
    
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return ref;
}

// 最初的组件
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

// 废弃的组件
// export default function useScroll(threshold: number) {
//   const ref = useRef<HTMLDivElement>(null); 
  
//   useEffect(() => {
//     const handler = () => {
//       const currentY = window.scrollY;
//       if (!ref.current) return;
      
//       // 直接操作DOM避免React重渲染
//       ref.current.style.transform = currentY > threshold 
//         ? 'translateY(0)'
//         : 'translateY(-100%)';
//     };
    
//     const rafHandler = () => requestAnimationFrame(handler);
//     window.addEventListener('scroll', rafHandler, { passive: true });
    
//     return () => window.removeEventListener('scroll', rafHandler);
//   }, [threshold]);

//   return ref; 
// }
