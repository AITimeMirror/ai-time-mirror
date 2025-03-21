"use client";

import { useEffect, useState } from "react";
import { DataProps } from "@/lib/types";
import { motion } from "framer-motion";
import { FADE_DOWN_ANIMATION_VARIANTS } from "@/lib/constants";
import PhotoBooth from "@/components/home/photo-booth";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

export default function PhotoPage({
  id,
  data: fallbackData,
}: {
  id: string;
  data: DataProps;
}) {
  const [data, setData] = useState<DataProps>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const realtime = supabase.channel(id);

  // 图片预加载
  useEffect(() => {
    if (!data) return;
    
    const preloadImages = () => {
      const inputImg = new Image();
      const outputImg = new Image();
      let loadedCount = 0;
      
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= 2) {
          setIsLoading(false);
        }
      };
      
      inputImg.onload = checkAllLoaded;
      inputImg.onerror = checkAllLoaded;
      outputImg.onload = checkAllLoaded;
      outputImg.onerror = checkAllLoaded;
      
      if (data.input) inputImg.src = data.input;
      if (data.output) outputImg.src = data.output;
    };
    
    preloadImages();
    
    // 设置超时，防止图片加载过久
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [data]);

  if (!fallbackData?.output && !fallbackData?.failed) {
    realtime
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "data",
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          setData(payload.new as DataProps);
          await realtime.unsubscribe();
          await supabase.removeChannel(realtime);
        },
      )
      .subscribe();
  }

  return (
    <div className="flex flex-col items-center justify-center full-width-page">
      <motion.div
        className="z-10 max-w-2xl px-5 xl:px-0"
        initial="hidden"
        whileInView="show"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        <motion.h1
          className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]"
          variants={FADE_DOWN_ANIMATION_VARIANTS}
        >
          Your Results
        </motion.h1>
        
        {isLoading ? (
          <div className="mt-10 w-full max-w-xl">
            <Skeleton className="aspect-square w-full rounded-2xl h-[350px] sm:h-[600px] sm:w-[600px]" />
            <div className="mt-4 flex justify-center space-x-4">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        ) : (
          <PhotoBooth
            id={id}
            input={data.input}
            output={data.output}
            failed={data.failed}
            containerClassName="h-[350px] sm:h-[600px] sm:w-[600px]"
          />
        )}
      </motion.div>
    </div>
  );
}
