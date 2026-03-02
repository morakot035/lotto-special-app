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
    if (!token) return;

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
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เข้าสู่ระบบ",
        text: "ไม่พบ token",
      });
      return;
    }

    const raw = normalizeInput(bulkText);

    if (raw.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้ใส่เลข",
        text: "กรอกเลขก่อนนะ",
      });
      return;
    }

    const invalid = raw.filter((n) => !isValidNumber(n, digits));
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

    // กันซ้ำในหน้า (กันเบื้องต้น)
    const existsSet = new Set(
      rules
        .filter((r) => r.kind === kind && String(r.digits) === digits)
        .map((r) => r.number),
    );
    const toAdd = raw.filter((n) => !existsSet.has(n));

    if (toAdd.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "เลขซ้ำทั้งหมด",
        text: "เลขที่กรอกมีอยู่แล้ว",
      });
      return;
    }

    const title =
      kind === "LOCK" ? "เพิ่มเลขอั้น (50%) ?" : "เพิ่มเลขไม่รับซื้อ ?";
    const badge = kind === "LOCK" ? "เลขอั้น 50%" : "ไม่รับซื้อ";

    const result = await Swal.fire({
      icon: "question",
      title,
      html: `
        <div style="text-align:left">
          <div><b>ประเภท:</b> ${badge}</div>
          <div><b>จำนวน:</b> ${toAdd.length.toLocaleString()} เลข</div>
          <div style="margin-top:8px; font-size:12px; color:#64748b">
            ตัวอย่าง: ${toAdd.slice(0, 14).join(" ")}${
              toAdd.length > 14 ? " ..." : ""
            }
          </div>
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
      // await Swal.fire({
      //   title: "กำลังบันทึก...",
      //   allowOutsideClick: false,
      //   didOpen: () => Swal.showLoading(),
      // });

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
    if (!token) return;

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
    if (!token) return;

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
    <div className="min-h-screen bg-slate-50">
      {/* Header (pattern like keying page) */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
              {/* settings icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M19.4 15a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2-1.6-1.9-3.3-2.4 1a7.2 7.2 0 0 0-1.7-1l-.4-2.6H9l-.4 2.6a7.2 7.2 0 0 0-1.7 1l-2.4-1-1.9 3.3 2 1.6a7.8 7.8 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.6 1.9 3.3 2.4-1c.5.4 1.1.7 1.7 1l.4 2.6h6l.4-2.6c.6-.3 1.2-.6 1.7-1l2.4 1 1.9-3.3-2-1.6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                ตั้งค่าเลขอั้น / เลขไม่รับซื้อ
              </div>
              <div className="text-sm text-slate-500">
                เลขอั้น = ยึด 50% (คิดยอดสุทธิครึ่งหนึ่ง) • เลขไม่รับซื้อ =
                ห้ามรับรายการนั้น
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {lockBadge}
                {blockBadge}
              </div>
            </div>
          </div>

          <Link
            href="/Home"
            className="inline-flex items-center gap-2 rounded-2xl border bg-white px-5 py-3 font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <span className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
      <div className="mx-auto max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <CardShell
          title="เพิ่มกติกา"
          subtitle="วางเลขหลายตัวได้ (เว้นวรรค/คอมม่า/ขึ้นบรรทัดใหม่) แล้วเลือกเพิ่มเป็น “เลขอั้น” หรือ “ไม่รับซื้อ”"
          badgeText="RULES"
          badgeClassName="bg-emerald-50 text-emerald-800 border-emerald-200"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6v12M6 12h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
        >
          {/* Digit switch */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDigits("2")}
              className={`rounded-2xl border px-4 py-3 font-extrabold transition ${
                digits === "2"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              เลข 2 ตัว
            </button>
            <button
              type="button"
              onClick={() => setDigits("3")}
              className={`rounded-2xl border px-4 py-3 font-extrabold transition ${
                digits === "3"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              เลข 3 ตัว
            </button>
          </div>

          {/* textarea */}
          <div className="mt-5 rounded-[22px] border bg-slate-50 overflow-hidden">
            <div className="px-5 py-4 bg-white border-b">
              <div className="font-extrabold text-slate-800">
                วางเลขที่ต้องการตั้งค่า
              </div>
              <div className="text-xs text-slate-500">
                ตัวอย่าง: {digits === "2" ? "12 34 56" : "123 456 789"}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full min-h-[220px] rounded-2xl border px-5 py-4 bg-white outline-none focus:ring-2 focus:ring-emerald-200 font-mono text-sm"
                placeholder={
                  digits === "2"
                    ? "เช่น 12 34 56\nหรือ 12,34,56"
                    : "เช่น 123 456 789\nหรือ 123,456,789"
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => addRule("LOCK")}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white py-3 font-extrabold transition shadow-sm"
                >
                  เพิ่ม “เลขอั้น 50%”
                </button>
                <button
                  type="button"
                  onClick={() => addRule("BLOCK")}
                  className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-3 font-extrabold transition shadow-sm"
                >
                  เพิ่ม “ไม่รับซื้อ”
                </button>
              </div>

              <div className="text-xs text-slate-500">
                * เลขอั้น: ตอนคีย์หวย จะคิดยอดสุทธิ “ครึ่งหนึ่ง” และควรทำ
                highlight ในสรุปยอด • เลขไม่รับซื้อ: ควรบล็อกไม่ให้บันทึกรายการ
              </div>
            </div>
          </div>
        </CardShell>

        {/* RIGHT */}
        <CardShell
          title="รายการล่าสุด"
          subtitle="ดูว่าเรา “อั้นเลขอะไร” / “ไม่รับซื้อเลขอะไร” อยู่บ้าง"
          badgeText="SUMMARY"
          badgeClassName="bg-sky-50 text-sky-900 border-sky-200"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"
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
            <button
              type="button"
              onClick={() => setTab("LOCK")}
              className={`px-4 py-2 rounded-2xl font-extrabold border transition ${
                tab === "LOCK"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              เลขอั้น (50%)
            </button>
            <button
              type="button"
              onClick={() => setTab("BLOCK")}
              className={`px-4 py-2 rounded-2xl font-extrabold border transition ${
                tab === "BLOCK"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              เลขไม่รับซื้อ
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={loadRules}
                className="rounded-2xl border px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
              >
                รีเฟรช
              </button>
            </div>
          </div>

          {/* filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเลข เช่น 123"
                className="w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={onSearch}
                className="shrink-0 rounded-2xl border px-4 py-3 font-extrabold hover:bg-slate-50"
              >
                ค้นหา
              </button>
            </div>

            <select
              value={filterDigits}
              onChange={(e) =>
                setFilterDigits(e.target.value as "ALL" | DigitMode)
              }
              className="rounded-2xl border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="ALL">ทั้งหมด (2 & 3)</option>
              <option value="2">เฉพาะ 2 ตัว</option>
              <option value="3">เฉพาะ 3 ตัว</option>
            </select>

            <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 bg-white">
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
          <div className="mt-4 overflow-auto rounded-[22px] border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 border-b text-left whitespace-nowrap">
                    กติกา
                  </th>
                  <th className="p-3 border-b text-left whitespace-nowrap">
                    ชนิด
                  </th>
                  <th className="p-3 border-b text-left whitespace-nowrap">
                    เลข
                  </th>
                  <th className="p-3 border-b text-left whitespace-nowrap">
                    สถานะ
                  </th>
                  <th className="p-3 border-b text-right whitespace-nowrap">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : shown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  shown.map((r) => (
                    <tr
                      key={r._id}
                      className={`hover:bg-slate-50 ${rowTint(r.kind)}`}
                    >
                      <td className="p-3 border-b">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border ${badgeKind(
                            r.kind,
                          )}`}
                        >
                          {r.kind === "LOCK" ? "อั้น 50%" : "ไม่รับซื้อ"}
                        </span>
                      </td>
                      <td className="p-3 border-b">{r.digits} ตัว</td>
                      <td className="p-3 border-b font-mono text-base font-extrabold">
                        {r.number}
                      </td>
                      <td className="p-3 border-b">
                        <button
                          type="button"
                          onClick={() => toggleRuleActive(r._id, !r.active)}
                          className={`rounded-2xl px-4 py-2 font-extrabold border transition ${
                            r.active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {r.active ? "ใช้งาน" : "ปิด"}
                        </button>
                      </td>
                      <td className="p-3 border-b text-right">
                        <button
                          type="button"
                          onClick={() => removeRule(r)}
                          className="rounded-2xl border px-4 py-2 font-extrabold hover:bg-white"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* pink info bar (same pattern as your keying page) */}
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-center text-rose-700 font-extrabold text-sm">
            *** เลขอั้น จะคิดยอดสุทธิ 50% ตอนคีย์ทันที • เลขไม่รับซื้อ
            ควรบล็อกไม่ให้บันทึกรายการ ***
          </div>
        </CardShell>
      </div>
    </div>
  );
}
