import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { GalleryPage } from "@/app/gallery/gallery-page";

export default async function Gallery({
  searchParams,
}: {
  searchParams: { page?: string; size?: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
    
  // 获取分页参数
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 8;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize - 1;
  
  // 获取总数据量
  const { count } = await supabase
    .from("data")
    .select("*", { count: "exact", head: true })
    .match({ user_id: user?.id || "", failed: false });
    
  // 获取当前页数据
  const { data } = await supabase
    .from("data")
    .select("*")
    .order("created_at", { ascending: false })
    .match({ user_id: user?.id || "", failed: false })
    .range(start, end);
    
  return (
    <div className="flex flex-col items-center justify-center">
      <GalleryPage 
        data={data} 
        totalCount={count || 0} 
        currentPage={currentPage} 
        pageSize={pageSize} 
      />
    </div>
  )
}
