"use client";

import { useEffect, useState } from "react";
import { DataProps } from "@/lib/types";
import { motion } from "framer-motion";
import { FADE_DOWN_ANIMATION_VARIANTS } from "@/lib/constants";
import PhotoBooth from "@/components/home/photo-booth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { UploadDialog, useUploadDialog } from "@/components/home/upload-dialog";
import { /* ArrowRight */ Upload } from "lucide-react";

export default function PhotoPage({
  id,
  data: fallbackData,
}: {
  id: string;
  data: DataProps;
}) {
  const [data, setData] = useState<DataProps>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(!fallbackData?.output && !fallbackData?.failed);
  const [imagesDisplayed, setImagesDisplayed] = useState(false); // 添加状态

  const supabase = createClient();
  const realtime = supabase.channel(id);
  const setShowUploadModal = useUploadDialog((s) => s.setOpen);

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
          setIsProcessing(false); // 数据更新后，处理完成
          await realtime.unsubscribe();
          await supabase.removeChannel(realtime);
        },
      )
      .subscribe();
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <UploadDialog />
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
          <div className="w-full max-w-xl">
            <Skeleton className="aspect-square h-[350px] w-full rounded-2xl sm:h-[450px] sm:w-[450px]" />
          </div>
        ) : (
          <PhotoBooth
            id={id}
            input={data.input}
            output={data.output}
            failed={data.failed}
            containerClassName="h-[350px] sm:h-[450px] sm:w-[450px]"
            onImagesLoaded={() => setImagesDisplayed(true)} // 添加回调
          />
        )}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="space-x-2 rounded-full border border-primary transition-colors hover:bg-primary-foreground hover:text-primary"
            disabled={isLoading || isProcessing || !imagesDisplayed} // 添加条件
          >            
            <Upload className="h-5 w-5" />
            <p>Upload Another Photo</p>
          </Button>          
        </div>
      </motion.div>
    </div>
  );
}
