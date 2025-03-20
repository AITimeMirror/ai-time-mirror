import { useEffect, useRef } from "react";

export default function useScroll(threshold: number) {
  const ref = useRef<HTMLDivElement>(null); 
  
  useEffect(() => {
    const handler = () => {
      const currentY = window.scrollY;
      if (!ref.current) return;
      
      // 直接操作DOM避免React重渲染
      ref.current.style.transform = currentY > threshold 
        ? 'translateY(0)'
        : 'translateY(-100%)';
    };
    
    const rafHandler = () => requestAnimationFrame(handler);
    window.addEventListener('scroll', rafHandler, { passive: true });
    
    return () => window.removeEventListener('scroll', rafHandler);
  }, [threshold]);

  return ref; 
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
