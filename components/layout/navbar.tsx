/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import useScroll from "@/lib/hooks/use-scroll";
// import { UserDropdown } from "./user-dropdown";
import { createClient } from "@/lib/supabase/client";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  // SignInDialog,
  useSignInDialog,
} from "@/components/layout/sign-in-dialog";
import { Tables } from "@/lib/supabase/types_db";
import { create } from "zustand";
import dynamic from "next/dynamic";
import { Suspense } from "react";

type UserDataStore = {
  userData: Tables<"users"> | null;
  setUserData: (userData: Tables<"users"> | null) => void;
};

export const useUserDataStore = create<UserDataStore>((set) => ({
  userData: null,
  setUserData: (userData) => set(() => ({ userData: userData })),
}));

export default function Navbar() {
  const setUserData = useUserDataStore((s) => s.setUserData);

  const supabase = createClient();

  const { data: userData, isLoading } = useSWR("userData", async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .single();

    setUserData(userData);
    return userData;
  });

  // const { data: userData, isLoading } = useSWRImmutable(
  //   "userData",
  //   async () => {
  //     const { data: userData } = await supabase
  //       .from("users")
  //       .select("*")
  //       .single();

  //     setUserData(userData);

  //     return userData;
  //   },
  // );

  const setShowSignInDialog = useSignInDialog((s) => s.setOpen);
  const scrolled = useScroll(50);

  const SignInDialog = dynamic(
    () =>
      import("@/components/layout/sign-in-dialog").then(
        (mod) => mod.SignInDialog,
      ),
    {
      ssr: false,
      loading: () => (
        <div className="size-9 animate-pulse rounded-full bg-gray-200" />
      ),
    },
  );

  const UserDropdown = dynamic(
    () =>
      import("@/components/layout/user-dropdown").then(
        (mod) => mod.UserDropdown,
      ),
    {
      ssr: false,
      loading: () => (
        <div className="size-9 animate-pulse rounded-full bg-gray-200" />
      ),
    },
  );

  return (
    <>
      <Suspense>
        <SignInDialog />
      </Suspense>
      {/* 外层固定定位容器 */}
      <div className={"fixed top-0 z-30 w-full transition-all fixed-navbar"}>
        {/* 内层动态样式容器 */}
        <div className={`
          mx-5 h-16 
          max-w-screen-xl 
          xl:mx-auto
          border-b border-transparent
          ${scrolled 
            ? "bg-white/50 backdrop-blur-xl" 
            : ""}
          transition-[transform]
          `}
        >
          <div className="flex h-full items-center justify-between">
            <Link href="/" className="flex items-center font-display text-2xl">
              <img
                src="/logo.png"
                alt="Logo image of a chat bubble"
                width="191"
                height="191"
                className="mr-2 size-[30px] rounded-sm"
              />
              <p>Extrapolate</p>
            </Link>
            <div>
              {userData ? (
                <Suspense>
                  <UserDropdown userData={userData} />
                </Suspense>
              ) : (
                !isLoading && (
                  <Button
                    size="sm"
                    className="rounded-full border border-primary transition-all hover:bg-primary-foreground hover:text-primary"
                    onClick={() => setShowSignInDialog(true)}
                  >
                    Sign In
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
