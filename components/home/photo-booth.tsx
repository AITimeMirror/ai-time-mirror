"use client";

/* eslint-disable @next/next/no-img-element */
import { FADE_DOWN_ANIMATION_VARIANTS } from "@/lib/constants";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { LoadingCircle } from "../shared/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";

function forceDownload(blobUrl: string, filename: string) {
  let a: any = document.createElement("a");
  a.download = filename;
  a.href = blobUrl;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function PhotoBooth({
  id,
  input,
  output,
  failed,
  initialState = 1,
  containerClassName, // 用于 motion.div
  cardClassName, // 用于 Card
  onImagesLoaded, // 添加回调属性
}: {
  id?: string;
  input: string;
  output: string | null;
  failed?: boolean | null;
  initialState?: 0 | 1;
  containerClassName?: string; 
  cardClassName?: string;
  onImagesLoaded?: () => void; // 添加类型定义
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initialState);
  const [downloading, setDownloading] = useState(false);
  const inputImgRef = useRef<HTMLImageElement>(null);
  const outputImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() as 0 | 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() as 0 | 1);
    });
  }, [api]);

  // 添加图片加载监听
  useEffect(() => {
    if (!onImagesLoaded || !input || !output) return;
    
    let loadedCount = 0;
    const totalImages = 2;
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        onImagesLoaded();
      }
    };
    
    const inputImg = inputImgRef.current;
    const outputImg = outputImgRef.current;
    
    if (inputImg) {
      if (inputImg.complete) {
        checkAllLoaded();
      } else {
        inputImg.addEventListener('load', checkAllLoaded);
        inputImg.addEventListener('error', checkAllLoaded);
      }
    }
    
    if (outputImg) {
      if (outputImg.complete) {
        checkAllLoaded();
      } else {
        outputImg.addEventListener('load', checkAllLoaded);
        outputImg.addEventListener('error', checkAllLoaded);
      }
    }
    
    return () => {
      if (inputImg) {
        inputImg.removeEventListener('load', checkAllLoaded);
        inputImg.removeEventListener('error', checkAllLoaded);
      }
      if (outputImg) {
        outputImg.removeEventListener('load', checkAllLoaded);
        outputImg.removeEventListener('error', checkAllLoaded);
      }
    };
  }, [input, output, onImagesLoaded]);

  return (
    <motion.div
      className={cn("group relative mx-auto mt-10 size-full", containerClassName)}
      variants={FADE_DOWN_ANIMATION_VARIANTS}
    >
      <Button
        onClick={(event) => {
          event.stopPropagation();
          api?.canScrollNext() ? api?.scrollNext() : api?.scrollPrev();
        }}
        variant="secondary"
        className="hover:bg-secondary absolute left-5 top-5 z-20 rounded-full border transition-all hover:scale-105 active:scale-95"
      >
        <p className="text-muted-foreground font-semibold">
          {api?.selectedScrollSnap() === 1 ? "View original" : "View result"}
        </p>
      </Button>
      {/*
        only show the download button if:
          - it's on a page with an id (i.e. not the demo page)
          - there's an output
          - we're in the output tab
      */}
      {id && output && !failed && current === 1 && (
        <Button
          onClick={(event) => {
            event.stopPropagation();
            setDownloading(true);
            fetch(output, {
              headers: new Headers({
                Origin: location.origin,
              }),
              mode: "cors",
            })
              .then((response) => response.blob())
              .then((blob) => {
                let blobUrl = window.URL.createObjectURL(blob);
                forceDownload(
                  blobUrl,
                  `${id || "demo"}.${current === 1 ? "gif" : ""}`,
                );
                setDownloading(false);
              })
              .catch((e) => console.error(e));
          }}
          variant="secondary"
          size="icon"
          className="hover:bg-secondary absolute right-5 top-5 z-20 rounded-full border transition-all hover:scale-105 active:scale-95"
        >
          {downloading ? (
            <LoadingCircle />
          ) : (
            <Download className="text-muted-foreground h-5 w-5" />
          )}
        </Button>
      )}

      <Carousel
        setApi={setApi}
        opts={{
          startIndex: initialState,
        }}
        className="relative rounded-2xl"
      >
        <CarouselContent>
          {/* Input */}
          <CarouselItem>
            <Card className={cn("flex aspect-[1/1] items-center justify-center overflow-hidden rounded-2xl", cardClassName)}>
              <img
                ref={inputImgRef}
                alt="input image"
                src={input || ""}
                className="h-full w-full object-cover"
              />
            </Card>
          </CarouselItem>

          {/* Output */}
          <CarouselItem>
            <Card className={cn("flex aspect-[1/1] items-center justify-center overflow-hidden rounded-2xl", cardClassName)}>
              {failed ? (
                <p className="text-center text-sm text-red-500">
                  Failed to run - could not find face in image. Try another!{" "}
                  <br /> 10 credits returned
                </p>
              ) : !output ? (
                <div className="flex flex-col items-center justify-center">
                  <LoadingCircle />
                  <motion.div
                    className="my-4 space-y-4"
                    initial="hidden"
                    animate="show"
                    transition={{ delayChildren: 5 }}
                    viewport={{ once: true }}
                  >
                    <motion.p
                      className="text-muted-foreground text-sm"
                      variants={FADE_DOWN_ANIMATION_VARIANTS}
                    >
                      This can take a minute to run.
                    </motion.p>
                  </motion.div>
                </div>
              ) : (
                <img
                  ref={outputImgRef}
                  alt="output image"
                  src={output || ""}
                  className="h-full w-full object-cover"
                />
              )}
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </motion.div>
  );
}
