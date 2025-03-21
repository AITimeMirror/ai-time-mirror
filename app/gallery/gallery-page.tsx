"use client";

import { useEffect, useState, Suspense } from "react";
import Balancer from "react-wrap-balancer";
import PhotoBooth from "@/components/home/photo-booth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataProps } from "@/lib/types";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface GalleryPageProps {
  data: DataProps[] | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

// 创建一个内部组件来使用 useSearchParams
function GalleryPageInner({ data, totalCount, currentPage, pageSize }: GalleryPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // 计算总页数
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // 创建新的查询参数
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );
  
  // 页面切换函数
  const handlePageChange = (pageNumber: number) => {
    const query = createQueryString("page", pageNumber.toString());
    router.push(`${pathname}?${query}`);
    // 滚动到页面顶部
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 生成分页项
  const generatePaginationItems = () => {
    const items = [];
    
    // 添加上一页按钮
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href={currentPage > 1 ? `${pathname}?${createQueryString("page", (currentPage - 1).toString())}` : "#"} 
          onClick={(e) => {
            if (currentPage <= 1) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            handlePageChange(currentPage - 1);
          }}
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // 如果总页数小于等于5，显示所有页码
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", i.toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // 显示第一页
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            href={`${pathname}?${createQueryString("page", "1")}`}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // 如果当前页靠近开始
      if (currentPage <= 3) {
        items.push(
          <PaginationItem key={2}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", "2")}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(2);
              }}
              isActive={currentPage === 2}
            >
              2
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={3}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", "3")}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(3);
              }}
              isActive={currentPage === 3}
            >
              3
            </PaginationLink>
          </PaginationItem>
        );
        
        if (totalPages > 3) {
          items.push(
            <PaginationItem key="ellipsis1">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      } 
      // 如果当前页靠近结束
      else if (currentPage >= totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
        
        items.push(
          <PaginationItem key={totalPages - 2}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", (totalPages - 2).toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages - 2);
              }}
              isActive={currentPage === totalPages - 2}
            >
              {totalPages - 2}
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={totalPages - 1}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", (totalPages - 1).toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages - 1);
              }}
              isActive={currentPage === totalPages - 1}
            >
              {totalPages - 1}
            </PaginationLink>
          </PaginationItem>
        );
      } 
      // 当前页在中间
      else {
        items.push(
          <PaginationItem key="ellipsis3">
            <PaginationEllipsis />
          </PaginationItem>
        );
        
        items.push(
          <PaginationItem key={currentPage - 1}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", (currentPage - 1).toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            >
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        );
        
        items.push(
          <PaginationItem key={currentPage}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", currentPage.toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage);
              }}
              isActive={true}
            >
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        );
        
        items.push(
          <PaginationItem key={currentPage + 1}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", (currentPage + 1).toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
            >
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        );
        
        items.push(
          <PaginationItem key="ellipsis4">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // 显示最后一页
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink 
              href={`${pathname}?${createQueryString("page", totalPages.toString())}`}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // 添加下一页按钮
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href={currentPage < totalPages ? `${pathname}?${createQueryString("page", (currentPage + 1).toString())}` : "#"}
          onClick={(e) => {
            if (currentPage >= totalPages) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            handlePageChange(currentPage + 1);
          }}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return items;
  };

  useEffect(() => {
    // 当数据加载完成后
    if (data) {
      // 短暂延迟以确保DOM更新
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [data]);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]">
        <Balancer>Gallery</Balancer>
      </div>
      
      {isLoading ? (
        <div className="
          grid 
          w-full 
          max-w-7xl 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4 
          gap-4 
          gap-y-8
          px-0
          mx-auto
          mt-8
        ">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="flex justify-center items-center">
              <div className="w-full aspect-[3/4]">
                <Skeleton className="w-full h-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="
          grid 
          w-full 
          max-w-7xl 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4 
          gap-4 
          gap-y-8
          px-0
          mx-auto        
        ">
          {data?.map((row) => (
            <div key={row.id} className="flex justify-center items-center">
              <div 
                className="cursor-pointer transition-all hover:scale-[1.01]"
                onClick={() => router.push(`/p/${row.id}`)}
              >
                <PhotoBooth
                  id={row.id}
                  input={row.input}
                  output={row.output}
                  failed={row.failed}
                  initialState={0}
                  containerClassName="mt-0" // 覆盖默认的mt-10
                  cardClassName="aspect-[3/4] w-full h-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* shadcn/ui 分页组件 */}
      {totalPages > 1 && (
        <div className="mt-10 mb-8 w-full max-w-7xl">          
          <Pagination>
            <PaginationContent>
              {generatePaginationItems()}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

// 导出一个包含 Suspense 的组件
export function GalleryPage(props: GalleryPageProps) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center">
        <div className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]">
          <Balancer>Gallery</Balancer>
        </div>
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 px-0 mx-auto mt-8">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="flex justify-center items-center">
              <div className="w-full aspect-[3/4]">
                <Skeleton className="w-full h-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <GalleryPageInner {...props} />
    </Suspense>
  );
}