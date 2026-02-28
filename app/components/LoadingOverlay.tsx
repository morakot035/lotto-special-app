"use client";
import { useLoading } from "../context/LoadingContext";

export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-white border-white/30"></div>
    </div>
  );
}
