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
  BarChart3,
  Search,
  ChevronRight,
  Settings,
} from "lucide-react";

import LogoutButton from "../components/LogoutButton";
import { useAuthGuard } from "../hooks/useAuthGuard";

import { useEffect, useMemo, useState } from "react";

import { useLoading } from "../context/LoadingContext";

import { apiClient } from "../services/apiClient";
import { getToken } from "../services/auth";

import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

// ============================================================================
// TYPES
// ============================================================================

type MenuGroup = "operation" | "report" | "setting" | "system";

type MenuItem = {
  title: string;
  description: string;
  href: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  color: string;
  bg: string;

  group: MenuGroup;

  badge?: string;

  isDanger?: boolean;
};

// ============================================================================
// MENU
// ============================================================================

const menu: MenuItem[] = [
  // ==========================================================================
  // OPERATION
  // ==========================================================================

  {
    title: "ผู้ซื้อ / คนเดินโพยหวย",
    description: "จัดการรายชื่อผู้ซื้อและข้อมูลคนเดินโพย",
    href: "/Home/Buyers",
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-50",
    group: "operation",
  },

  {
    title: "คีย์ข้อมูลหวย",
    description: "บันทึกรายการซื้อหวยของลูกค้า",
    href: "/Home/Lotto",
    icon: Keyboard,
    color: "text-violet-600",
    bg: "bg-violet-50",
    group: "operation",
    badge: "งานหลัก",
  },

  {
    title: "ตรวจหวย",
    description: "บันทึกและตรวจสอบผลรางวัล",
    href: "/Home/LotteryCheck",
    icon: CheckCircle,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    group: "operation",
  },

  // ==========================================================================
  // REPORT
  // ==========================================================================

  {
    title: "สรุปยอดผู้ซื้อ",
    description: "ยอดซื้อรวมและรายการซื้อแยกตามผู้ซื้อ",
    href: "/Home/Reports/buyerSummary",
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    group: "report",
  },

  {
    title: "สรุปรายการซื้อทั้งหมด",
    description: "ตรวจสอบรายการซื้อทั้งหมดในระบบ",
    href: "/Home/Reports/orderItems",
    icon: FileText,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    group: "report",
  },

  {
    title: "สรุปยอดซื้อ",
    description: "ดูยอดซื้อรวมทุกประเภทในภาพรวม",
    href: "/Home/Reports/overall",
    icon: BarChart3,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    group: "report",
  },

  {
    title: "รายงาน 2 ตัว",
    description: "สรุป 2 ตัวบน / 2 ตัวล่าง พร้อมตัดเก็บและตัดส่ง",
    href: "/Home/Reports/2d",
    icon: Hash,
    color: "text-blue-600",
    bg: "bg-blue-50",
    group: "report",
  },

  {
    title: "รายงาน 3 ตัว",
    description: "สรุป 3 ตัวบน / ล่าง / โต๊ด พร้อมตัดเก็บและตัดส่ง",
    href: "/Home/Reports/3d",
    icon: Hash,
    color: "text-teal-600",
    bg: "bg-teal-50",
    group: "report",
  },

  {
    title: "สรุปเลขอั้น",
    description: "ดูเฉพาะเลขอั้นที่ถูกซื้อ แยก 2 ตัวและ 3 ตัว",
    href: "/Home/Reports/limit",
    icon: Ban,
    color: "text-rose-600",
    bg: "bg-rose-50",
    group: "report",
    badge: "อั้น",
  },

  {
    title: "สรุปเลขไม่อั้น",
    description: "รายงาน 2 ตัวและ 3 ตัว โดยไม่รวมเลขอั้น",
    href: "/Home/Reports/no-limit",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    group: "report",
    badge: "ไม่อั้น",
  },

  {
    title: "วิเคราะห์ยอดซื้อ",
    description: "จัดอันดับเลขยอดนิยม ดูยอดเงิน จำนวนคนซื้อ และความถี่",
    href: "/Home/Reports/number-analysis",
    icon: BarChart3,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    group: "report",
    badge: "Analysis",
  },

  // ==========================================================================
  // SETTING
  // ==========================================================================

  {
    title: "ตั้งค่าตัดเก็บรายตัว",
    description: "กำหนดยอดตัดเก็บตามประเภทและเลข",
    href: "/Home/Settings/Keep",
    icon: Sliders,
    color: "text-amber-600",
    bg: "bg-amber-50",
    group: "setting",
  },

  {
    title: "ตั้งค่าเลขอั้น / ไม่รับซื้อ",
    description: "กำหนดเลขอั้นและเลขที่ไม่ต้องการรับซื้อ",
    href: "/Home/Settings/Limits",
    icon: Ban,
    color: "text-rose-600",
    bg: "bg-rose-50",
    group: "setting",
  },

  {
    title: "เตะตัดเก็บรายตัว",
    description: "ตั้งเงื่อนไขเตะยอดและตัดเก็บเฉพาะเลข",
    href: "/Home/KickRules",
    icon: Sliders,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    group: "setting",
  },

  // ==========================================================================
  // SYSTEM
  // ==========================================================================

  {
    title: "ล้างข้อมูลหวย",
    description: "ลบข้อมูลหวยทั้งหมดออกจากระบบ",
    href: "/Home/backup",
    icon: Database,
    color: "text-red-600",
    bg: "bg-red-50",
    group: "system",
    badge: "Danger",
    isDanger: true,
  },
];

// ============================================================================
// AUTH
// ============================================================================

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

  localStorage.removeItem("token");

  window.location.href = "/Login";
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default function HomePage() {
  useAuthGuard();

  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const { showLoading, hideLoading } = useLoading();

  // ==========================================================================
  // AUTH CHECK
  // ==========================================================================

  useEffect(() => {
    async function fetchAll() {
      const token = getToken();

      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");

        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");

        return;
      }
    }

    void fetchAll();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return menu;
    }

    return menu.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [search]);

  function groupItems(group: MenuGroup) {
    return filteredMenu.filter((item) => item.group === group);
  }

  // ==========================================================================
  // DELETE ALL
  // ==========================================================================

  async function handleDeleteAllEntries() {
    const token = getToken();

    if (!token) {
      toast.error("ไม่พบ token");

      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการลบข้อมูลทั้งหมด",

      html: `
          <div style="
            font-size:14px;
            line-height:1.8;
          ">
            คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลหวยทั้งหมด?
            <br/>

            <span style="
              color:#dc2626;
              font-weight:700;
            ">
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

      cancelButtonColor: "#64748b",

      background: "#ffffff",

      customClass: {
        popup: "rounded-3xl",

        confirmButton: "rounded-xl",

        cancelButton: "rounded-xl",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

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
  }

  // ==========================================================================
  // MENU CLICK
  // ==========================================================================

  async function handleMenuClick(item: MenuItem) {
    if (deleting) {
      return;
    }

    if (item.isDanger) {
      await handleDeleteAllEntries();

      return;
    }

    window.location.href = item.href;
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-800">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}

            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Hash className="h-7 w-7" />
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Lottery Management
                </div>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  ระบบจัดการหวย
                </h1>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  จัดการรายการซื้อ ตั้งค่า และดูรายงานทั้งหมดในที่เดียว
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 md:block">
                พร้อมใช้งาน
              </div>

              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* CONTENT */}
      {/* ================================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================================================================== */}
        {/* WELCOME / SEARCH */}
        {/* ================================================================== */}

        <section className="mb-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px] lg:items-center lg:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                วันนี้ต้องการทำอะไร?
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
                เลือกเมนูตามหมวดด้านล่าง หรือค้นหาเมนูที่ต้องการใช้งานได้ทันที
              </p>
            </div>

            {/* SEARCH */}

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเมนู เช่น เลขอั้น, รายงาน, ผู้ซื้อ..."
                className="
                  h-14
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  pl-12
                  pr-4
                  text-sm
                  font-semibold
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-emerald-300
                  focus:bg-white
                  focus:ring-4
                  focus:ring-emerald-50
                "
              />
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* OPERATION */}
        {/* ================================================================== */}

        <MenuSection
          title="งานประจำ"
          subtitle="เมนูที่ใช้สำหรับบันทึกและจัดการข้อมูลประจำวัน"
          items={groupItems("operation")}
          onClick={handleMenuClick}
          deleting={deleting}
        />

        {/* ================================================================== */}
        {/* REPORT */}
        {/* ================================================================== */}

        <MenuSection
          title="รายงานและวิเคราะห์"
          subtitle="ดูยอดซื้อ สรุปเลข และวิเคราะห์ข้อมูล"
          items={groupItems("report")}
          onClick={handleMenuClick}
          deleting={deleting}
          featured
        />

        {/* ================================================================== */}
        {/* SETTING */}
        {/* ================================================================== */}

        <MenuSection
          title="ตั้งค่าระบบหวย"
          subtitle="กำหนดเงื่อนไขตัดเก็บ เลขอั้น และกฎรายตัว"
          items={groupItems("setting")}
          onClick={handleMenuClick}
          deleting={deleting}
        />

        {/* ================================================================== */}
        {/* SYSTEM */}
        {/* ================================================================== */}

        <MenuSection
          title="ระบบ"
          subtitle="เครื่องมือสำหรับผู้ดูแลระบบ"
          items={groupItems("system")}
          onClick={handleMenuClick}
          deleting={deleting}
        />

        {/* ================================================================== */}
        {/* NO RESULT */}
        {/* ================================================================== */}

        {filteredMenu.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />

            <div className="text-lg font-black text-slate-700">ไม่พบเมนู</div>

            <div className="mt-1 text-sm font-medium text-slate-400">
              ลองค้นหาด้วยคำอื่น
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================================
// MENU SECTION
// ============================================================================

function MenuSection({
  title,
  subtitle,
  items,
  onClick,
  deleting,
  featured = false,
}: {
  title: string;

  subtitle: string;

  items: MenuItem[];

  onClick: (item: MenuItem) => void;

  deleting: boolean;

  featured?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      {/* SECTION HEADER */}

      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {featured ? (
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            ) : (
              <Settings className="h-5 w-5 text-slate-500" />
            )}

            <h2 className="text-xl font-black tracking-tight text-slate-900">
              {title}
            </h2>
          </div>

          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
          {items.length} เมนู
        </div>
      </div>

      {/* GRID */}

      <div
        className={[
          "grid gap-4",
          featured
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        ].join(" ")}
      >
        {items.map((item) => (
          <MenuCard
            key={item.title}
            item={item}
            onClick={onClick}
            disabled={deleting}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// MENU CARD
// ============================================================================

function MenuCard({
  item,
  onClick,
  disabled,
}: {
  item: MenuItem;

  onClick: (item: MenuItem) => void;

  disabled: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => void onClick(item)}
      disabled={disabled}
      className={[
        "group relative w-full overflow-hidden rounded-[24px] border bg-white p-5 text-left shadow-sm transition-all duration-200",

        item.isDanger
          ? "border-red-200 hover:-translate-y-1 hover:border-red-300 hover:shadow-lg"
          : "border-slate-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg",

        "disabled:cursor-not-allowed disabled:opacity-50",
      ].join(" ")}
    >
      {/* TOP */}

      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            item.bg,
            item.color,
          ].join(" ")}
        >
          <Icon className="h-6 w-6" />
        </div>

        {item.badge && (
          <span
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-black",

              item.isDanger
                ? "bg-red-50 text-red-600"
                : item.badge === "อั้น"
                  ? "bg-rose-50 text-rose-600"
                  : item.badge === "ไม่อั้น"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-indigo-50 text-indigo-600",
            ].join(" ")}
          >
            {item.badge}
          </span>
        )}
      </div>

      {/* CONTENT */}

      <h3
        className={[
          "text-base font-black leading-snug",

          item.isDanger ? "text-red-700" : "text-slate-900",
        ].join(" ")}
      >
        {item.title}
      </h3>

      <p className="mt-2 min-h-[44px] text-sm font-medium leading-[22px] text-slate-500">
        {item.description}
      </p>

      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span
          className={[
            "text-xs font-black",

            item.isDanger ? "text-red-600" : "text-emerald-700",
          ].join(" ")}
        >
          {item.isDanger ? "จัดการข้อมูล" : "เปิดเมนู"}
        </span>

        <span
          className={[
            "grid h-8 w-8 place-items-center rounded-full transition-all duration-200",

            item.isDanger
              ? "bg-red-50 text-red-600 group-hover:bg-red-100"
              : "bg-slate-50 text-slate-400 group-hover:translate-x-1 group-hover:bg-emerald-50 group-hover:text-emerald-700",
          ].join(" ")}
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}
