import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { GalleryPage } from "@/app/gallery/gallery-page";
import { TermsAndPrivacy } from "@/components/layout/terms-and-privacy";

export default async function Gallery() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("data")
    .select("*")
    .order("created_at", { ascending: false })
    .match({ user_id: user?.id || "", failed: false });
  return (
    <div className="flex flex-col items-center justify-center full-width-page">
      <GalleryPage data={data} />
      <TermsAndPrivacy/>
    </div>
    
  )
}
