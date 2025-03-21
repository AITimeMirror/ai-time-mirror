import HomePage from "@/components/home-page";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { FAQ } from "@/components/home/faq";

export const revalidate = 60;

async function getCount() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { count } = await supabase
    .from("data")
    .select("*", { count: "estimated", head: true });
  return count;
}

export default async function Home() {
  const count = await getCount();

  return (
    <div className="flex flex-col items-center justify-center">
      <HomePage count={count} />;
      <FAQ /> 
    </div>
  );
  
}
