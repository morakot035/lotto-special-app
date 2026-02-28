"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-md bg-red-600 px-4 py-1.5 text-white hover:bg-red-700"
      onClick={() => {
        localStorage.removeItem("token");
        router.replace("/Login");
      }}
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
