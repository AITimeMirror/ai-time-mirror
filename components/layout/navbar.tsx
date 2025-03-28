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
  const navbarRef = useScroll(100);
  // const scrolled = useScroll(50);

  const SignInDialog = dynamic(
    () =>
      import("@/components/layout/sign-in-dialog").then(
        (mod) => mod.SignInDialog,
      ),
    {
      ssr: false,
      // loading: () => (
      //   <div className="size-9 animate-pulse rounded-full bg-gray-200" />
      // ),
    },
  );

  const UserDropdown = dynamic(
    () =>
      import("@/components/layout/user-dropdown").then(
        (mod) => mod.UserDropdown,
      ),
    {
      ssr: false,
      // loading: () => (
      //   <div className="size-9 animate-pulse rounded-full bg-gray-200" />
      // ),
    },
  );

  return (
    <>
      <Suspense>
        <SignInDialog />
      </Suspense>
      {/* 外层固定定位容器 */}
      <div ref={navbarRef} className={"fixed-navbar fixed top-0 z-30 w-full"}>
        {/* 内层动态样式容器 */}
        <div
          className="
          navbar-inner h-16
          max-w-screen-xl 
          border-b
          border-transparent px-5
          xl:mx-auto"
        >
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center font-display text-2xl">
                <img
                  src="/logo.png"
                  alt="Logo image of a chat bubble"
                  width="191"
                  height="191"
                  className="mr-2 w-[32px] h-[32px] rounded-md"
                />
                <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TimeMirror</p>
              </Link>
            </div>

            {/* 居中的导航菜单项 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-lg font-medium tracking-wide text-gray-600 transition-colors duration-200 hover:text-black"
              >
                Home
              </Link>
              <Link
                href="/#pricing"
                className="text-lg font-medium tracking-wide text-gray-600 transition-colors duration-200 hover:text-black"
              >
                Pricing
              </Link>
              {userData && (
                <Link
                  href="/gallery"
                  className="text-lg font-medium tracking-wide text-gray-600 transition-colors duration-200 hover:text-black"
                >
                  My Gallery
                </Link>
              )}      
              
              <Link
                href="/#faq"
                className="text-lg font-medium tracking-wide text-gray-600 transition-colors duration-200 hover:text-black"
              >
                FAQ
              </Link>
            </div>

            <div>
              {userData ? (
                <Suspense>
                  <UserDropdown userData={userData} />
                </Suspense>
              ) : (
                !isLoading && (
                  <Button
                    size="sm"
                    // className="rounded-full border border-primary transition-all hover:bg-primary-foreground hover:text-primary"
                    className="space-x-2 rounded-full border border-blue-500 bg-blue-500 text-white transition-colors hover:bg-white hover:text-blue-700"
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
