"use client";

import {
  Users,
  Keyboard,
  CheckCircle,
  Sliders,
  Ban,
  FileText,
  Hash,
  Database,
} from "lucide-react";
import LogoutButton from "../components/LogoutButton";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useState, useEffect } from "react";
import { useLoading } from "../context/LoadingContext";
import { apiClient } from "../services/apiClient";
import { getToken } from "../services/auth";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

type MenuItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  isDanger?: boolean;
};

const menu: MenuItem[] = [
  {
    title: "ผู้ซื้อ/คนเดินโพยหวย",
    href: "/Home/Buyers",
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-100",
  },
  {
    title: "คีย์ข้อมูลหวย",
    href: "/Home/Lotto",
    icon: Keyboard,
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  {
    title: "ตั้งค่าตัดเก็บรายตัว",
    href: "/Home/Settings/Keep",
    icon: Sliders,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    title: "ตั้งค่าเลขอั้น/ไม่รับซื้อ",
    href: "/Home/Settings/Limits",
    icon: Ban,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  {
    title: "เตะตัดเก็บรายตัว",
    href: "/Home/KickRules",
    icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  {
    title: "สรุปยอดผู้ซื้อ",
    href: "/Home/Reports/buyerSummary",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    title: "สรุปรายการซื้อทั้งหมด",
    href: "/Home/Reports/orderItems",
    icon: Hash,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
  },
  {
    title: "สรุปยอดซื้อ",
    href: "/Home/Reports/overall",
    icon: Hash,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-100",
  },
  {
    title: "สรุป 2 ตัว บน–ล่าง",
    href: "/Home/Reports/2d",
    icon: Hash,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "สรุป 3 ตัว",
    href: "/Home/Reports/3d",
    icon: Hash,
    color: "text-teal-600",
    bg: "bg-teal-100",
  },
  {
    title: "ตรวจหวย",
    href: "/Home/LotteryCheck",
    icon: CheckCircle,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-100",
  },
  {
    title: "ล้างข้อมูลหวย",
    href: "/Home/backup",
    icon: Database,
    color: "text-red-600",
    bg: "bg-red-100",
    isDanger: true,
  },
];

async function alertAndRedirectToLogin(
  message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
) {
  await Swal.fire({
    icon: "warning",
    title: "ข้อความแจ้งเตือน",
    text: message,
    confirmButtonText: "ตกลง ไปหน้า Login",
    confirmButtonColor: "#4f46e5",
    background: "#1e1b4b",
    color: "#fff",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  // ลบ token เก่าออก แล้ว redirect
  localStorage.removeItem("token"); // หรือ localStorage.removeItem('token')
  window.location.href = "/Login";
}
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // ถ้า decode ไม่ได้ถือว่าหมดอายุ
  }
}

export default function HomePage() {
  useAuthGuard();

  const [deleting, setDeleting] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchAll = async () => {
      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteAllEntries = async () => {
    const token = getToken();
    if (!token) {
      toast.error("ไม่พบ token");
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการลบข้อมูลทั้งหมด",
      html: `
        <div style="font-size:14px; line-height:1.8;">
          คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลหวยทั้งหมด?<br/>
          <span style="color:#dc2626; font-weight:600;">
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </span>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl",
        cancelButton: "rounded-xl",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);
      showLoading();

      await apiClient.deleteEntries(token);

      await Swal.fire({
        title: "ลบข้อมูลสำเร็จ",
        text: "ข้อมูลหวยทั้งหมดถูกลบเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#10b981",
      });

      toast.success("ลบข้อมูลทั้งหมดสำเร็จ");
    } catch (err) {
      console.error(err);

      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ลบข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#ef4444",
      });

      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      hideLoading();
      setDeleting(false);
    }
  };

  const handleMenuClick = async (item: MenuItem) => {
    if (deleting) return;

    if (item.isDanger) {
      await handleDeleteAllEntries();
      return;
    }

    window.location.href = item.href;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-emerald-200 px-4 py-10 text-gray-800">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-8 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                Lottery Management System
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                เมนูจัดการระบบหวย
              </h1>
              <p className="mt-2 text-sm text-white/85 sm:text-base">
                จัดการข้อมูลผู้ซื้อ คีย์หวย ตั้งค่าเลขอั้น ดูรายงาน
                และล้างข้อมูลในระบบ
              </p>
            </div>

            <div className="shrink-0 self-start lg:self-center">
              <div className="rounded-2xl bg-white/15 p-2 backdrop-blur">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => void handleMenuClick(item)}
                disabled={deleting}
                className={[
                  "group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 text-left shadow-sm transition-all duration-300",
                  "hover:-translate-y-1.5 hover:shadow-2xl hover:ring-2 hover:ring-emerald-200",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  item.isDanger ? "hover:ring-red-200" : "",
                ].join(" ")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-100" />
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100/70 blur-2xl transition-all duration-300 group-hover:scale-125" />

                <div className="relative">
                  <div
                    className={[
                      "mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                      item.bg,
                      item.color,
                      "group-hover:scale-110",
                    ].join(" ")}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <h2
                    className={[
                      "mb-2 text-lg font-bold leading-snug transition-colors",
                      item.isDanger
                        ? "text-red-700 group-hover:text-red-600"
                        : "text-slate-800 group-hover:text-emerald-700",
                    ].join(" ")}
                  >
                    {item.title}
                  </h2>

                  <p className="text-sm leading-6 text-slate-500">
                    {item.isDanger
                      ? "ลบข้อมูลหวยทั้งหมดออกจากระบบ"
                      : "เข้าสู่เมนูเพื่อจัดการข้อมูลและดูรายละเอียดเพิ่มเติม"}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        item.isDanger
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      {item.isDanger ? "Danger Zone" : "Open Menu"}
                    </span>

                    <span className="text-sm font-semibold text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600">
                      →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
