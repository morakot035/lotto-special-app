"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { apiClient } from "../../services/apiClient";
import { getToken } from "../../services/auth";
import { useLoading } from "../../context/LoadingContext";
import { getErrMsg, formatDateTimeTH } from "../../utils/helper";
/* =====================
   CONFIG
===================== */
const ORDER_API_ENDPOINT = "/api/orders"; // <- ถ้า backend คุณใช้เส้นอื่น เปลี่ยนตรงนี้

/* =====================
   types
===================== */
interface Buyer {
  _id: string;
  name: string;
  phone: string;
}

interface BuyersResponse {
  success: boolean;
  data: Buyer[];
}

type Gate = "3" | "6";

type Item = {
  id: string;
  type: "special" | "quick";
  label: string; // ประเภทหวย เช่น สามตัวบน
  numbers: string[]; // ส่วนใหญ่ 1 ตัว/แถว
  amount: number;
  buyerId?: string;
  buyerName?: string;
  createdAt: string; // ISO
};

type BetRow = {
  betType:
    | "สองตัวบน"
    | "สองตัวล่าง"
    | "สามตัวบน"
    | "สามตัวล่าง"
    | "สามตัวโต๊ด"
    | "วิ่งบน"
    | "วิ่งล่าง";
  number: string;
  amount: number;
};

/* =====================
   utils
===================== */
const uid = () => Math.random().toString(36).slice(2);

function cn(n: number) {
  return n.toLocaleString();
}
function formatDateTime(iso: string) {
  return iso.replace("T", " ").slice(0, 19);
}

function canonicalTod3(n: string) {
  return n.split("").sort().join("");
}

function permuteUnique3(num: string): string[] {
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

function parseAmountSpec(specRaw: string): number[] {
  const spec = specRaw.trim().replace(/=+$/g, "");
  return spec
    .split(/[*xX]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x));
}

/**
 * แทงเร็ว → แตกเป็นรายการตาราง
 * - 2 ตัว: top*bottom
 * - 3 ตัว: top*tod หรือ top*tod*bottom
 * - วิ่ง: runTop*runBottom
 */
function parseQuickToRows(text: string): { rows: BetRow[]; errors: string[] } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: BetRow[] = [];
  const errors: string[] = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const parts = line.split(/\s+/).filter(Boolean);

    if (parts.length < 2) {
      errors.push(
        `บรรทัด ${li + 1}: รูปแบบไม่ถูกต้อง (ต้องมีเลข และ จำนวนเงิน)`,
      );
      continue;
    }

    const amountSpec = parts[parts.length - 1];
    const nums = parts.slice(0, -1);

    if (!nums.every((n) => /^\d+$/.test(n))) {
      errors.push(`บรรทัด ${li + 1}: มีตัวอักษรที่ไม่ใช่ตัวเลข`);
      continue;
    }

    const amts = parseAmountSpec(amountSpec);
    if (amts.length === 0 || amts.some((x) => Number.isNaN(x))) {
      errors.push(`บรรทัด ${li + 1}: จำนวนเงินไม่ถูกต้อง`);
      continue;
    }

    const g1 = nums.filter((n) => n.length === 1);
    const g2 = nums.filter((n) => n.length === 2);
    const g3 = nums.filter((n) => n.length === 3);
    const other = nums.filter((n) => ![1, 2, 3].includes(n.length));
    if (other.length) {
      errors.push(`บรรทัด ${li + 1}: รองรับเฉพาะเลข 1/2/3 หลัก`);
      continue;
    }

    // 2 ตัว: บน*ล่าง
    if (g2.length) {
      const top = amts[0] ?? 0;
      const bottom = amts[1] ?? 0;
      for (const n of g2) {
        if (top > 0) rows.push({ betType: "สองตัวบน", number: n, amount: top });
        if (bottom > 0)
          rows.push({ betType: "สองตัวล่าง", number: n, amount: bottom });
      }
    }

    // 3 ตัว: บน*โต๊ด หรือ บน*โต๊ด*ล่าง
    if (g3.length) {
      const top = amts[0] ?? 0;
      const tod = amts[1] ?? 0;
      const bottom = amts[2] ?? 0;
      for (const n of g3) {
        if (top > 0) rows.push({ betType: "สามตัวบน", number: n, amount: top });
        if (tod > 0)
          rows.push({
            betType: "สามตัวโต๊ด",
            number: canonicalTod3(n),
            amount: tod,
          });
        if (bottom > 0)
          rows.push({ betType: "สามตัวล่าง", number: n, amount: bottom });
      }
    }

    // วิ่ง: วิ่งบน*วิ่งล่าง
    if (g1.length) {
      const runTop = amts[0] ?? 0;
      const runBottom = amts[1] ?? 0;
      for (const n of g1) {
        if (runTop > 0)
          rows.push({ betType: "วิ่งบน", number: n, amount: runTop });
        if (runBottom > 0)
          rows.push({ betType: "วิ่งล่าง", number: n, amount: runBottom });
      }
    }
  }

  return { rows, errors };
}

/* =====================
   sweetalert helpers
===================== */
function toastSuccess(title: string) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  });
}
function toastError(title: string) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: "error",
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

/* =====================
   small UI components
===================== */
function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "blue" | "indigo";
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "blue"
        ? "bg-sky-100 text-sky-900"
        : "bg-indigo-100 text-indigo-900";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}
    >
      {children}
    </span>
  );
}

function CardShell({
  title,
  subtitle,
  icon,
  tone = "green",
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: "green" | "blue" | "indigo";
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const ring =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "blue"
        ? "bg-sky-50 text-sky-700"
        : "bg-indigo-50 text-indigo-700";

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl grid place-items-center ${ring}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900">
              {title}
            </div>
            {subtitle && (
              <div className="text-sm text-slate-500">{subtitle}</div>
            )}
          </div>
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 font-extrabold transition"
    >
      {children}
    </button>
  );
}

/* =====================
   page
===================== */
export default function LottoPage() {
  const { showLoading, hideLoading } = useLoading();

  /* buyers */
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerId, setBuyerId] = useState<string>("");

  const buyerName = useMemo(
    () => buyers.find((b) => b._id === buyerId)?.name,
    [buyers, buyerId],
  );

  useEffect(() => {
    const fetchBuyers = async () => {
      const token = getToken();
      if (!token) {
        toastError("ยังไม่ได้เข้าสู่ระบบ (ไม่มี token)");
        return;
      }

      showLoading();
      try {
        const res = await apiClient.getBuyers(token);

        const list = Array.isArray(res?.data) ? res.data : [];

        setBuyers(list);
        toastSuccess("โหลดรายชื่อผู้ซื้อเรียบร้อย");
      } catch (err) {
        console.error("โหลด buyers ล้มเหลว", err);
        toastError("โหลดรายชื่อผู้ซื้อล้มเหลว");
      } finally {
        hideLoading();
      }
    };

    fetchBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* shared items (ตารางขวา) */
  const [items, setItems] = useState<Item[]>([]);
  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  /* =====================
     SPECIAL
  ===================== */
  const [gate, setGate] = useState<Gate>("6");
  const [num3, setNum3] = useState("");

  const [spTopOn, setSpTopOn] = useState(true);
  const [spBottomOn, setSpBottomOn] = useState(true);
  const [spTodOn, setSpTodOn] = useState(true);

  const [spTopAmt, setSpTopAmt] = useState("100");
  const [spBottomAmt, setSpBottomAmt] = useState("100");
  const [spTodAmt, setSpTodAmt] = useState("100");

  const specialPerms = useMemo(() => {
    if (!/^\d{3}$/.test(num3)) return [];
    const all = permuteUnique3(num3).sort();
    return gate === "6" ? all : all.slice(0, 3);
  }, [num3, gate]);

  const specialPreviewRows = useMemo(() => {
    if (specialPerms.length === 0)
      return { rows: [] as BetRow[], errors: [] as string[] };

    const top = Number(spTopAmt);
    const bottom = Number(spBottomAmt);
    const tod = Number(spTodAmt);

    const errors: string[] = [];
    if (!spTopOn && !spBottomOn && !spTodOn)
      errors.push("กรุณาเลือกอย่างน้อย 1 ประเภท (บน/ล่าง/โต๊ด)");
    if (spTopOn && (!Number.isFinite(top) || top <= 0))
      errors.push("จำนวนเงิน 'บน' ไม่ถูกต้อง");
    if (spBottomOn && (!Number.isFinite(bottom) || bottom <= 0))
      errors.push("จำนวนเงิน 'ล่าง' ไม่ถูกต้อง");
    if (spTodOn && (!Number.isFinite(tod) || tod <= 0))
      errors.push("จำนวนเงิน 'โต๊ด' ไม่ถูกต้อง");

    const rows: BetRow[] = [];

    if (spTopOn && top > 0) {
      for (const n of specialPerms)
        rows.push({ betType: "สามตัวบน", number: n, amount: top });
    }
    if (spBottomOn && bottom > 0) {
      for (const n of specialPerms)
        rows.push({ betType: "สามตัวล่าง", number: n, amount: bottom });
    }
    if (spTodOn && tod > 0) {
      const canon = canonicalTod3(num3);
      rows.push({ betType: "สามตัวโต๊ด", number: canon, amount: tod });
    }

    return { rows, errors };
  }, [
    specialPerms,
    spTopOn,
    spBottomOn,
    spTodOn,
    spTopAmt,
    spBottomAmt,
    spTodAmt,
    num3,
  ]);

  function addSpecial() {
    if (!buyerId) {
      toastError("กรุณาเลือกผู้ซื้อ/คนเดินโพย");
      return;
    }
    if (!/^\d{3}$/.test(num3)) {
      toastError("เลขต้องเป็น 3 ตัว");
      return;
    }
    if (specialPreviewRows.errors.length) {
      Swal.fire({
        icon: "warning",
        title: "กรอกข้อมูลไม่ครบ",
        html: specialPreviewRows.errors.map((e) => `• ${e}`).join("<br/>"),
      });
      return;
    }
    if (specialPreviewRows.rows.length === 0) {
      toastError("ไม่มีรายการที่บันทึกได้");
      return;
    }

    const createdAt = new Date().toISOString();
    const mapped: Item[] = specialPreviewRows.rows.map((r) => ({
      id: uid(),
      type: "special",
      label: r.betType,
      numbers: [r.number],
      amount: r.amount,
      buyerId,
      buyerName,
      createdAt,
    }));

    setItems((prev) => [...mapped.reverse(), ...prev]);
    setNum3("");
    toastSuccess("เพิ่มเลขพิเศษลงรายการแล้ว");
  }

  /* =====================
     QUICK
  ===================== */
  const [quickText, setQuickText] = useState(
    "58 85 59 95 60 06 61 16 62 26 20*20\n23 32 33 34 43 50*0\n23 32 33 34 43 0*10\n4 5 6 500*500\n10 874 1 100*100\n874 100*200*300",
  );

  const quickPreview = useMemo(() => {
    const { rows, errors } = parseQuickToRows(quickText);
    const okTotal = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, errors, okTotal };
  }, [quickText]);

  function addQuick() {
    if (!buyerId) {
      toastError("กรุณาเลือกผู้ซื้อ/คนเดินโพย");
      return;
    }

    const { rows, errors } = parseQuickToRows(quickText);
    if (errors.length) {
      Swal.fire({
        icon: "warning",
        title: "รูปแบบแทงเร็วไม่ถูกต้อง",
        html: errors.map((e) => `• ${e}`).join("<br/>"),
      });
      return;
    }
    if (rows.length === 0) {
      toastError("ไม่มีรายการที่บันทึกได้");
      return;
    }

    const createdAt = new Date().toISOString();
    const mapped: Item[] = rows.map((r) => ({
      id: uid(),
      type: "quick",
      label: r.betType,
      numbers: [r.number],
      amount: r.amount,
      buyerId,
      buyerName,
      createdAt,
    }));

    setItems((prev) => [...mapped.reverse(), ...prev]);
    toastSuccess("เพิ่มแทงเร็วลงรายการแล้ว");
  }

  /* =====================
     CONFIRM ORDER (ยิง API)
  ===================== */
  const canConfirm = Boolean(buyerId) && items.length > 0 && total > 0;

  async function confirmOrder() {
    if (!buyerId) {
      toastError("กรุณาเลือกผู้ซื้อก่อนยืนยัน");
      return;
    }
    if (items.length === 0) {
      toastError("ยังไม่มีรายการให้ยืนยัน");
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันการสั่งซื้อ?",
      html: `
        <div style="text-align:left">
          <div><b>ผู้ซื้อ:</b> ${buyerName ?? "-"}</div>
          <div><b>จำนวนรายการ:</b> ${items.length.toLocaleString()} รายการ</div>
          <div><b>ยอดรวม:</b> ${cn(total)} บาท</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      toastError("ยกเลิกการยืนยันแล้ว");
      return;
    }

    const token = getToken();
    if (!token) {
      toastError("ยังไม่ได้เข้าสู่ระบบ (ไม่มี token)");
      return;
    }

    // payload (เตรียมส่งข้อมูล)
    const payload = {
      buyer_id: buyerId,
      buyer_name: buyerName,
      total_amount: total,
      items: items.map((i) => ({
        type: i.type,
        bet_type: i.label,
        number: i.numbers[0],
        amount: i.amount,
        created_at: i.createdAt,
      })),
    };

    try {
      //   await Swal.fire({
      //     title: "กำลังบันทึกคำสั่งซื้อ...",
      //     allowOutsideClick: false,
      //     didOpen: () => Swal.showLoading(),
      //   });
      console.log(payload);
      const res = await fetch(ORDER_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: unknown;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const d = data as {
        ok?: boolean;
        success?: boolean;
        message?: string;
        error?: { message?: string };
      } | null;

      if (!res.ok || d?.ok === false || d?.success === false) {
        const msg =
          d?.message ||
          d?.error?.message ||
          `บันทึกล้มเหลว (status ${res.status})`;

        throw new Error(msg);
      }

      await Swal.fire({
        icon: "success",
        title: "บันทึกคำสั่งซื้อสำเร็จ",
        html: `<div>ยอดรวม <b>${cn(total)}</b> บาท</div>`,
        confirmButtonText: "ตกลง",
      });

      // หลังสำเร็จ: ล้างตาราง
      setItems([]);
      toastSuccess("ล้างรายการเพื่อเริ่มคีย์ใหม่แล้ว");
    } catch (err: unknown) {
      const msg = getErrMsg(err);
      Swal.fire({
        icon: "error",
        title: "บันทึกคำสั่งซื้อไม่สำเร็จ",
        text: msg ?? "เกิดข้อผิดพลาด",
      });
    }
  }

  /* =====================
     render
  ===================== */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar (ให้ฟีลเดียวกับ Home) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 grid place-items-center text-emerald-700">
              {/* icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 8h10M7 12h10M7 16h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 3h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                คีย์ข้อมูลหวย
              </div>
              <div className="text-sm text-slate-500">
                เลือกผู้ซื้อ/คนเดินโพย แล้วคีย์ได้ทั้ง <b>เลขพิเศษ</b> +{" "}
                <b>แทงเร็ว</b> (กดแล้วแตกเป็นรายการฝั่งขวา)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="mx-auto max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <CardShell
            title="ผู้ซื้อ / คนเดินโพย"
            subtitle="ดึงข้อมูลจาก MongoDB (buyers)"
            tone="green"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21a8 8 0 1 0-16 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
            right={<Pill tone="green">BUYERS</Pill>}
          >
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">- กรุณาเลือก -</option>
              {buyers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                  {b.phone ? ` (${b.phone})` : ""}
                </option>
              ))}
            </select>

            {buyerId ? (
              <div className="mt-3 text-sm text-slate-600">
                กำลังคีย์ในนาม:{" "}
                <span className="font-bold text-slate-900">{buyerName}</span>
              </div>
            ) : (
              <div className="mt-3 text-sm text-rose-600 font-semibold">
                * กรุณาเลือกผู้ซื้อก่อนบันทึก
              </div>
            )}
          </CardShell>

          {/* SPECIAL */}
          <CardShell
            title="โหมดเลขพิเศษ"
            subtitle="เลือก 3/6 ประตู + เลือก บน/ล่าง/โต๊ด แล้วกดตกลง"
            tone="blue"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v18M3 12h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M7 7h10v10H7V7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            }
            right={<Pill tone="blue">SPECIAL</Pill>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  ประเภท
                </label>
                <select
                  value={gate}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "3" || v === "6") setGate(v);
                  }}
                  className="mt-2 w-full rounded-xl border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="3">เลข 3 ประตู</option>
                  <option value="6">เลข 6 ประตู</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  ตัวเลข (3 ตัว)
                </label>
                <input
                  value={num3}
                  onChange={(e) => setNum3(e.target.value.trim())}
                  placeholder="เช่น 456"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-xl border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-sky-200 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border bg-white p-4">
              <div className="text-sm font-extrabold text-slate-800 mb-3">
                เลือกประเภทและจำนวนเงิน
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spTopOn}
                    onChange={(e) => setSpTopOn(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-bold">บน</div>
                    <input
                      value={spTopAmt}
                      onChange={(e) => setSpTopAmt(e.target.value)}
                      placeholder="เช่น 100"
                      inputMode="numeric"
                      disabled={!spTopOn}
                      className="mt-2 w-full rounded-lg border px-3 py-2 bg-white disabled:bg-slate-100"
                    />
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spBottomOn}
                    onChange={(e) => setSpBottomOn(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-bold">ล่าง</div>
                    <input
                      value={spBottomAmt}
                      onChange={(e) => setSpBottomAmt(e.target.value)}
                      placeholder="เช่น 100"
                      inputMode="numeric"
                      disabled={!spBottomOn}
                      className="mt-2 w-full rounded-lg border px-3 py-2 bg-white disabled:bg-slate-100"
                    />
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spTodOn}
                    onChange={(e) => setSpTodOn(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-bold">โต๊ด</div>
                    <input
                      value={spTodAmt}
                      onChange={(e) => setSpTodAmt(e.target.value)}
                      placeholder="เช่น 100"
                      inputMode="numeric"
                      disabled={!spTodOn}
                      className="mt-2 w-full rounded-lg border px-3 py-2 bg-white disabled:bg-slate-100"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border bg-white px-4 py-3">
              <div className="text-xs font-bold text-slate-600">
                พรีวิวเลขกลับ ({gate} ประตู)
              </div>
              {specialPerms.length === 0 ? (
                <div className="text-sm text-slate-400 mt-1">
                  กรอกเลข 3 ตัวเพื่อแสดงพรีวิว
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {specialPerms.map((n) => (
                    <span
                      key={n}
                      className="px-2 py-1 rounded-lg border text-sm font-mono bg-slate-50"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* <div className="mt-4 rounded-2xl border bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                  พรีวิวรายการที่จะเข้าตาราง (เลขพิเศษ)
                </div>
                <div className="text-xs text-slate-500">
                  รวม:{" "}
                  <span className="font-extrabold">
                    {cn(
                      specialPreviewRows.rows.reduce((s, r) => s + r.amount, 0),
                    )}
                  </span>
                </div>
              </div>

              {specialPreviewRows.errors.length > 0 ? (
                <div className="mt-2 text-sm text-rose-600 space-y-1">
                  {specialPreviewRows.errors.map((e, idx) => (
                    <div key={idx}>• {e}</div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {specialPreviewRows.rows.slice(0, 10).map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 bg-slate-50"
                    >
                      <div className="text-slate-700">
                        <span className="font-bold">{r.betType}</span>{" "}
                        <span className="font-mono">{r.number}</span>
                      </div>
                      <div className="font-extrabold text-slate-800">
                        {cn(r.amount)}
                      </div>
                    </div>
                  ))}
                  {specialPreviewRows.rows.length > 10 && (
                    <div className="text-xs text-slate-500">
                      … และอีก {specialPreviewRows.rows.length - 10} รายการ
                    </div>
                  )}
                </div>
              )}
            </div> */}

            <div className="mt-4">
              <PrimaryButton onClick={addSpecial}>
                ตกลง (เลขพิเศษ → แตกเป็นรายการด้านขวา)
              </PrimaryButton>
            </div>
          </CardShell>

          {/* QUICK */}
          <CardShell
            title="โหมดแทงเร็ว"
            subtitle="รองรับ 20*20 / 100*200*300 และตัวคูณ x หรือ *"
            tone="indigo"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M19 15v6M16 18h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            right={<Pill tone="indigo">QUICK</Pill>}
          >
            <textarea
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              className="w-full min-h-[220px] rounded-xl border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-200 font-mono text-sm"
            />

            {/* <div className="mt-4 rounded-2xl border bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                  พรีวิวการแตกประเภท (แทงเร็ว)
                </div>
                <div className="text-xs text-slate-500">
                  รวม:{" "}
                  <span className="font-extrabold">
                    {cn(quickPreview.okTotal)}
                  </span>
                </div>
              </div>

              {quickPreview.errors.length > 0 ? (
                <div className="mt-2 text-sm text-rose-600 space-y-1">
                  {quickPreview.errors.map((e, idx) => (
                    <div key={idx}>• {e}</div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {quickPreview.rows.slice(0, 12).map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 bg-slate-50"
                    >
                      <div className="text-slate-700">
                        <span className="font-bold">{r.betType}</span>{" "}
                        <span className="font-mono">{r.number}</span>
                      </div>
                      <div className="font-extrabold text-slate-800">
                        {cn(r.amount)}
                      </div>
                    </div>
                  ))}
                  {quickPreview.rows.length > 12 && (
                    <div className="text-xs text-slate-500">
                      … และอีก {quickPreview.rows.length - 12} รายการ
                    </div>
                  )}
                </div>
              )}
            </div> */}

            <div className="mt-4">
              <PrimaryButton onClick={addQuick}>
                ตกลง (แทงเร็ว → แตกเป็นรายการด้านขวา)
              </PrimaryButton>
            </div>
          </CardShell>
        </div>

        {/* RIGHT */}
        <CardShell
          title="รายการล่าสุด"
          subtitle="แสดงผลจากเลขพิเศษ + แทงเร็ว"
          tone="blue"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 11l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22A10 10 0 1 0 2 12a10 10 0 0 0 10 10Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
          right={<Pill tone="blue">SUMMARY</Pill>}
        >
          <div className="overflow-auto rounded-2xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-2 border-b text-left whitespace-nowrap">
                    ประเภทหวย
                  </th>
                  <th className="p-2 border-b text-left whitespace-nowrap">
                    ตัวเลข
                  </th>
                  <th className="p-2 border-b text-right whitespace-nowrap">
                    จำนวนเงิน
                  </th>
                  <th className="p-2 border-b text-left whitespace-nowrap">
                    วัน/เวลา
                  </th>
                  <th className="p-2 border-b text-left whitespace-nowrap">
                    ผู้ซื้อ
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  items.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="p-2 border-b">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            i.type === "special"
                              ? "bg-sky-100 text-sky-900"
                              : "bg-indigo-100 text-indigo-900"
                          }`}
                        >
                          {i.label}
                        </span>
                      </td>
                      <td className="p-2 border-b font-mono">
                        {i.numbers.join(" ")}
                      </td>
                      <td className="p-2 border-b text-right font-extrabold">
                        {cn(i.amount)}
                      </td>
                      <td className="p-2 border-b text-slate-600 whitespace-nowrap">
                        {formatDateTimeTH(i.createdAt)}
                      </td>
                      <td className="p-2 border-b">{i.buyerName ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-rose-600 text-xs font-extrabold text-center">
            *** 3 ตัวโต๊ด จะเก็บเป็นเลขเดียว (เช่น 321/231/132 → 123) ***
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setItems([]);
                toastSuccess("ล้างรายการแล้ว");
              }}
              className="rounded-xl border px-4 py-2.5 text-sm font-extrabold hover:bg-slate-50"
            >
              ลบรายการทั้งหมด
            </button>

            <button
              type="button"
              onClick={confirmOrder}
              disabled={!canConfirm}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-extrabold text-white"
            >
              ยืนยันการสั่งซื้อ (บันทึกลงระบบ)
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="text-sm text-slate-500">
              ผู้ซื้อ:{" "}
              <span className="font-extrabold text-slate-900">
                {buyerName ?? "-"}
              </span>
              <div className="text-xs text-slate-400 mt-1">
                * กด “ยืนยันการสั่งซื้อ” เพื่อยิง API และบันทึกเข้า DB
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">ยอดรวมทั้งหมด</div>
              <div className="text-3xl font-extrabold text-slate-900">
                {cn(total)}{" "}
                <span className="text-base font-bold text-slate-500">บาท</span>
              </div>
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
