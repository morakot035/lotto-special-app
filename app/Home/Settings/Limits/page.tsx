"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { apiClient } from "../../../services/apiClient";
import { getToken } from "../../../services/auth";
import { useLoading } from "../../../context/LoadingContext";

/** =========================
 *  Types
 *  ========================= */
type DigitMode = "2" | "3";
type RuleTab = "LOCK" | "BLOCK";

type Rule = {
  _id: string;
  kind: RuleTab; // LOCK = เลขอั้น, BLOCK = ไม่รับซื้อ
  digits: 2 | 3;
  number: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** =========================
 *  Utils
 *  ========================= */
function normalizeInput(text: string): string[] {
  return text
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidNumber(n: string, digits: DigitMode): boolean {
  return digits === "2" ? /^\d{2}$/.test(n) : /^\d{3}$/.test(n);
}

function digitsToNum(d: DigitMode): 2 | 3 {
  return d === "2" ? 2 : 3;
}

function sortNumber(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

function badgeKind(kind: RuleTab) {
  return kind === "LOCK"
    ? "bg-yellow-100 text-yellow-900 border-yellow-200"
    : "bg-rose-100 text-rose-900 border-rose-200";
}

function rowTint(kind: RuleTab) {
  return kind === "LOCK" ? "bg-yellow-50/70" : "bg-rose-50/50";
}

/** =========================
 *  LOCK expansion helpers
 *  - LOCK 2 ตัว: อั้นกลับด้วย (45 -> 45 + 54)
 *  - LOCK 3 ตัว: อั้นกลับ 6 กลับ (123 -> 6 permutations)
 *    (ถ้ามีเลขซ้ำจะได้จำนวน < 6 แบบ unique)
 *  ========================= */
function reverse2(n: string): string {
  return n.length === 2 ? `${n[1]}${n[0]}` : n;
}

function permuteUnique3(num: string): string[] {
  // unique permutations for 3 digits
  const res = new Set<string>();
  const a = num.split("");

  const swap = (i: number, j: number) => {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  };

  const backtrack = (idx: number) => {
    if (idx === a.length) {
      res.add(a.join(""));
      return;
    }
    const used = new Set<string>();
    for (let i = idx; i < a.length; i++) {
      if (used.has(a[i])) continue;
      used.add(a[i]);
      swap(idx, i);
      backtrack(idx + 1);
      swap(idx, i);
    }
  };

  backtrack(0);
  return Array.from(res);
}

function expandLockNumbers(digits: DigitMode, numbers: string[]): string[] {
  const out: string[] = [];
  for (const n of numbers) {
    if (digits === "2") {
      out.push(n);
      out.push(reverse2(n));
    } else {
      // 3 digits => 6 permutations (unique)
      out.push(...permuteUnique3(n));
    }
  }
  // unique + stable
  return Array.from(new Set(out));
}

/** =========================
 *  Small UI helpers (pattern same as keying page)
 *  ========================= */
function CardShell(props: {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeClassName: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[26px] shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
            {props.icon ?? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <div>
            <div className="text-lg font-extrabold text-slate-800">
              {props.title}
            </div>
            <div className="text-sm text-slate-500">{props.subtitle}</div>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${props.badgeClassName}`}
        >
          {props.badgeText}
        </span>
      </div>

      <div className="p-6">{props.children}</div>
    </div>
  );
}

function UiButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline";
  tone?: "emerald" | "amber" | "rose" | "slate";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const {
    children,
    onClick,
    variant = "solid",
    tone = "slate",
    disabled,
    className,
    type = "button",
  } = props;

  const solidMap: Record<typeof tone, string> = {
    emerald:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_18px_40px_-24px_rgba(16,185,129,0.9)]",
    amber:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_18px_40px_-24px_rgba(245,158,11,0.7)]",
    rose: "bg-rose-600 hover:bg-rose-700 text-white shadow-[0_18px_40px_-24px_rgba(244,63,94,0.65)]",
    slate:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)]",
  };

  const outlineMap: Record<typeof tone, string> = {
    emerald: "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-white hover:bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-white hover:bg-rose-50 text-rose-800 border-rose-200",
    slate: "bg-white hover:bg-slate-50 text-slate-800 border-slate-200",
  };

  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99] focus:outline-none focus:ring-4";
  const ring =
    tone === "emerald"
      ? "focus:ring-emerald-200"
      : tone === "amber"
        ? "focus:ring-amber-200"
        : tone === "rose"
          ? "focus:ring-rose-200"
          : "focus:ring-slate-200";

  const style =
    variant === "solid" ? solidMap[tone] : `border ${outlineMap[tone]}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        ring,
        style,
        disabled ? "opacity-60 cursor-not-allowed shadow-none" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

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

export default function LimitsPage() {
  useAuthGuard();
  const { showLoading, hideLoading } = useLoading();

  // right tab
  const [tab, setTab] = useState<RuleTab>("LOCK");

  // left form
  const [digits, setDigits] = useState<DigitMode>("2");
  const [bulkText, setBulkText] = useState("");

  // data
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [filterDigits, setFilterDigits] = useState<"ALL" | DigitMode>("ALL");
  const [onlyActive, setOnlyActive] = useState(true);

  async function loadRules() {
    const token = getToken();
    if (!token) {
      await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
      return;
    }

    if (isTokenExpired(token)) {
      await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setLoadingTable(true);
    try {
      const res = await apiClient.getRules(token, {
        kind: tab,
        digits: filterDigits === "ALL" ? undefined : digitsToNum(filterDigits),
        active: onlyActive ? true : undefined,
        q: q.trim() ? q.trim() : undefined,
      });

      const list = Array.isArray(res?.data) ? (res.data as Rule[]) : [];
      setRules(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      await Swal.fire({
        icon: "error",
        title: "โหลดรายการไม่สำเร็จ",
        text: msg,
      });
    } finally {
      setLoadingTable(false);
    }
  }

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterDigits, onlyActive]);

  const shown = useMemo(() => {
    const kw = q.trim();
    return rules
      .filter((r) => r.kind === tab)
      .filter((r) => (onlyActive ? r.active : true))
      .filter((r) =>
        filterDigits === "ALL" ? true : String(r.digits) === filterDigits,
      )
      .filter((r) => (kw ? r.number.includes(kw) : true))
      .sort((a, b) => sortNumber(a.number, b.number));
  }, [rules, tab, q, filterDigits, onlyActive]);

  const lockedCount = useMemo(
    () => rules.filter((r) => r.kind === "LOCK" && r.active).length,
    [rules],
  );
  const blockedCount = useMemo(
    () => rules.filter((r) => r.kind === "BLOCK" && r.active).length,
    [rules],
  );

  async function onSearch() {
    await loadRules();
  }

  /** add */
  async function addRule(kind: RuleTab) {
    const token = getToken();
    if (!token) {
      await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
      return;
    }

    if (isTokenExpired(token)) {
      await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const raw0 = normalizeInput(bulkText);

    if (raw0.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้ใส่เลข",
        text: "กรอกเลขก่อนนะ",
      });
      return;
    }

    const invalid = raw0.filter((n) => !isValidNumber(n, digits));
    if (invalid.length > 0) {
      await Swal.fire({
        icon: "error",
        title: "รูปแบบเลขไม่ถูกต้อง",
        html: `<div style="text-align:left">ต้องเป็นเลข ${digits} ตัวเท่านั้น<br/>ตัวอย่างที่ผิด: <b>${invalid
          .slice(0, 10)
          .join(", ")}</b></div>`,
      });
      return;
    }

    // ✅ เฉพาะ “เลขอั้น” ต้องอั้นกลับด้วย
    // - 2 ตัว: เพิ่มเลขกลับ
    // - 3 ตัว: เพิ่มครบทุก permutation (6 กลับแบบ unique)
    const expanded = expandLockNumbers(digits, raw0);

    // กันซ้ำในหน้า (กันเบื้องต้น) — ต้องกันซ้ำหลัง expand แล้ว
    const existsSet = new Set(
      rules
        .filter((r) => r.kind === kind && String(r.digits) === digits)
        .map((r) => r.number),
    );

    const toAdd = expanded.filter((n) => !existsSet.has(n));

    if (toAdd.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "เลขซ้ำทั้งหมด",
        text: "เลขที่กรอกมีอยู่แล้ว (รวมเลขกลับแล้ว)",
      });
      return;
    }

    const title =
      kind === "LOCK"
        ? `เพิ่มเลขอั้น (50%) + อั้นกลับอัตโนมัติ ?`
        : `เพิ่มเลขไม่รับซื้อ + บล็อกกลับอัตโนมัติ ?`;

    const badge =
      kind === "LOCK" ? "เลขอั้น 50% (รวมเลขกลับ)" : "ไม่รับซื้อ (รวมเลขกลับ)";

    // ข้อความช่วยอธิบายการขยาย
    const explain =
      kind === "LOCK"
        ? digits === "2"
          ? `<div style="margin-top:8px; font-size:12px; color:#64748b">* 2 ตัว: เช่น 45 → เพิ่ม 45 และ 54</div>`
          : `<div style="margin-top:8px; font-size:12px; color:#64748b">* 3 ตัว: เช่น 123 → เพิ่มครบ 6 กลับ (123,132,213,231,312,321)</div>`
        : "";

    const result = await Swal.fire({
      icon: "question",
      title,
      html: `
        <div style="text-align:left">
          <div><b>ประเภท:</b> ${badge}</div>
          <div><b>จำนวนที่จะเพิ่ม:</b> ${toAdd.length.toLocaleString()} เลข</div>
          <div style="margin-top:8px; font-size:12px; color:#64748b">
            ตัวอย่าง: ${toAdd.slice(0, 14).join(" ")}${
              toAdd.length > 14 ? " ..." : ""
            }
          </div>
          ${explain}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "เพิ่ม",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading();

      // ✅ ส่ง “numbers” ที่ขยายแล้วไป backend ทีเดียว
      await apiClient.createRules(token, {
        kind,
        digits: digitsToNum(digits),
        numbers: toAdd,
      });

      await Swal.fire({
        icon: "success",
        title: "เพิ่มสำเร็จ",
        text: `เพิ่ม ${toAdd.length.toLocaleString()} เลขแล้ว`,
        timer: 900,
        showConfirmButton: false,
      });

      setBulkText("");
      await loadRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: msg,
      });
    } finally {
      hideLoading();
    }
  }

  /** toggle active */
  async function toggleRuleActive(id: string, nextActive: boolean) {
    const token = getToken();
    if (!token) {
      await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
      return;
    }

    if (isTokenExpired(token)) {
      await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      showLoading();
      await apiClient.updateRule(token, id, { active: nextActive });
      await loadRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      await Swal.fire({
        icon: "error",
        title: "อัปเดตไม่สำเร็จ",
        text: msg,
      });
    } finally {
      hideLoading();
    }
  }

  /** delete */
  async function removeRule(row: Rule) {
    const token = getToken();
    if (!token) {
      await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
      return;
    }

    if (isTokenExpired(token)) {
      await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "ลบรายการนี้?",
      html: `<div style="text-align:left"><b>${row.number}</b> (${row.digits} ตัว) - ${
        row.kind === "LOCK" ? "เลขอั้น 50%" : "ไม่รับซื้อ"
      }</div>`,
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading();
      await apiClient.deleteRule(token, row._id);

      await Swal.fire({
        icon: "success",
        title: "ลบแล้ว",
        timer: 700,
        showConfirmButton: false,
      });

      await loadRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      await Swal.fire({
        icon: "error",
        title: "ลบไม่สำเร็จ",
        text: msg,
      });
    } finally {
      hideLoading();
    }
  }

  /** UI: counts */
  const lockBadge = (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold border bg-yellow-50 text-yellow-900 border-yellow-200">
      เลขอั้นใช้งาน <span className="font-black">{lockedCount}</span>
    </span>
  );

  const blockBadge = (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold border bg-rose-50 text-rose-900 border-rose-200">
      ไม่รับซื้อใช้งาน <span className="font-black">{blockedCount}</span>
    </span>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-emerald-50/60">
      {/* glow background */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

      {/* Top bar */}
      <div className="relative border-b bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 grid place-items-center text-emerald-700 ring-1 ring-emerald-600/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 6h10M10 12h10M10 18h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 7.5h2M4 12h2M4 16.5h2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                ตั้งค่าเลขอั้น / เลขไม่รับซื้อ
              </div>
              <div className="text-sm text-slate-500">
                เลขอั้น = จ่าย 50% (แต่ “รับซื้อราคาเต็ม”) • เลขไม่รับซื้อ =
                ห้ามรับรายการนั้น
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {lockBadge}
                {blockBadge}
              </div>
            </div>
          </div>

          {/* Back */}
          <Link
            href="/Home"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold
                       hover:bg-slate-50 active:scale-[0.99]
                       shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            กลับหน้า Home
          </Link>
        </div>
      </div>

      {/* content */}
      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: add */}
          <CardShell
            title="เพิ่มกติกา"
            subtitle="วางเลขหลายตัวได้ (เว้นวรรค/คอมม่า/ขึ้นบรรทัดใหม่) แล้วเลือกเพิ่มเป็น “เลขอั้น” หรือ “ไม่รับซื้อ”"
            badgeText="RULES"
            badgeClassName="bg-emerald-50 text-emerald-800 border-emerald-200"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            {/* digit switch */}
            <div className="grid grid-cols-2 gap-3">
              <UiButton
                variant={digits === "2" ? "solid" : "outline"}
                tone={digits === "2" ? "slate" : "slate"}
                onClick={() => setDigits("2")}
              >
                เลข 2 ตัว
              </UiButton>
              <UiButton
                variant={digits === "3" ? "solid" : "outline"}
                tone={digits === "3" ? "slate" : "slate"}
                onClick={() => setDigits("3")}
              >
                เลข 3 ตัว
              </UiButton>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-extrabold text-slate-800">
                  วางเลขที่ต้องการตั้งค่า
                </div>
                <div className="text-xs text-slate-500">
                  ตัวอย่าง: {digits === "2" ? "12 34 56" : "123 456 789"}{" "}
                  (คั่นด้วย เว้นวรรค, คอมม่า, หรือขึ้นบรรทัดใหม่)
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={
                    digits === "2" ? "เช่น 12 34 56" : "เช่น 123 456 789"
                  }
                  className="w-full min-h-[220px] rounded-2xl border border-emerald-300/60 bg-white px-4 py-3
                             outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-300
                             font-mono text-sm shadow-sm"
                />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UiButton tone="amber" onClick={() => addRule("LOCK")}>
                    เพิ่ม “เลขอั้น 50%”
                  </UiButton>
                  <UiButton tone="rose" onClick={() => addRule("BLOCK")}>
                    เพิ่ม “ไม่รับซื้อ”
                  </UiButton>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  * กด “เลขอั้น” จะ <b>อั้นเลขกลับอัตโนมัติ</b> (2 ตัว = กลับ 1
                  ครั้ง, 3 ตัว = กลับครบ 6 แบบ)
                </div>
              </div>
            </div>
          </CardShell>

          {/* RIGHT: table */}
          <CardShell
            title="รายการล่าสุด"
            subtitle="ดูว่า “อั้นเลขอะไร” / “ไม่รับซื้อเลขอะไร” อยู่บ้าง"
            badgeText="SUMMARY"
            badgeClassName="bg-sky-50 text-sky-800 border-sky-200"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22A10 10 0 1 0 2 12a10 10 0 0 0 10 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            {/* tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <UiButton
                variant={tab === "LOCK" ? "solid" : "outline"}
                tone="amber"
                onClick={() => setTab("LOCK")}
                className="px-5"
              >
                เลขอั้น (50%)
              </UiButton>
              <UiButton
                variant={tab === "BLOCK" ? "solid" : "outline"}
                tone="slate"
                onClick={() => setTab("BLOCK")}
                className="px-5"
              >
                เลขไม่รับซื้อ
              </UiButton>

              <div className="ml-auto flex items-center gap-2">
                <UiButton
                  variant="outline"
                  tone="slate"
                  onClick={onSearch}
                  disabled={loadingTable}
                  className="px-4"
                >
                  รีเฟรช
                </UiButton>
              </div>
            </div>

            {/* filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเลข เช่น 123"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                           focus:ring-4 focus:ring-sky-200/70 focus:border-sky-300 transition"
              />

              <button
                type="button"
                onClick={onSearch}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold
                           hover:bg-slate-50 active:scale-[0.99] shadow-sm
                           focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                ค้นหา
              </button>

              <select
                value={filterDigits}
                onChange={(e) =>
                  setFilterDigits(e.target.value as "ALL" | DigitMode)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                           focus:ring-4 focus:ring-sky-200/70 focus:border-sky-300 transition"
              >
                <option value="ALL">ทั้งหมด (2 & 3)</option>
                <option value="2">เฉพาะ 2 ตัว</option>
                <option value="3">เฉพาะ 3 ตัว</option>
              </select>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                <span className="text-sm font-extrabold text-slate-700">
                  เฉพาะที่ใช้งาน
                </span>
              </label>
            </div>

            {/* table */}
            <div className="mt-4 overflow-auto rounded-3xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-700">
                  <tr>
                    <th className="p-3 border-b text-left font-extrabold">
                      กติกา
                    </th>
                    <th className="p-3 border-b text-left font-extrabold">
                      ชนิด
                    </th>
                    <th className="p-3 border-b text-left font-extrabold">
                      เลข
                    </th>
                    <th className="p-3 border-b text-left font-extrabold">
                      สถานะ
                    </th>
                    <th className="p-3 border-b text-right font-extrabold">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingTable ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-10 text-center text-slate-500"
                      >
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : shown.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-10 text-center text-slate-500"
                      >
                        ยังไม่มีรายการ
                      </td>
                    </tr>
                  ) : (
                    shown.map((r) => (
                      <tr
                        key={r._id}
                        className={[
                          "hover:bg-emerald-50/40 transition-colors",
                          rowTint(r.kind),
                        ].join(" ")}
                      >
                        <td className="p-3 border-b">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border",
                              badgeKind(r.kind),
                            ].join(" ")}
                          >
                            {r.kind === "LOCK" ? "อั้น 50%" : "ไม่รับซื้อ"}
                          </span>
                        </td>
                        <td className="p-3 border-b">{r.digits} ตัว</td>
                        <td className="p-3 border-b font-mono text-base font-black">
                          {r.number}
                        </td>
                        <td className="p-3 border-b">
                          <button
                            type="button"
                            onClick={() => toggleRuleActive(r._id, !r.active)}
                            className={[
                              "rounded-full px-4 py-1.5 text-xs font-extrabold border transition",
                              r.active
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
                            ].join(" ")}
                          >
                            {r.active ? "ใช้งาน" : "ปิด"}
                          </button>
                        </td>
                        <td className="p-3 border-b text-right">
                          <UiButton
                            variant="outline"
                            tone="slate"
                            onClick={() => removeRule(r)}
                            className="px-4 py-2"
                          >
                            ลบ
                          </UiButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-rose-700 text-xs font-extrabold text-center">
              *** เลขอั้น = จ่าย 50% ตอนถูกรางวัล • เลขไม่รับซื้อ =
              ระบบควรเตือนและไม่ให้บันทึกรายการนั้น ***
            </div>
          </CardShell>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          © 2026 Lotto App. All rights reserved.
        </div>
      </div>
    </div>
  );
}
