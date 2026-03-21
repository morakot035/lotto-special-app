"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  apiClient,
  TwoDigitSummaryResponse,
  TwoDigitSummaryRow,
} from "../../../services/apiClient";
import { getToken } from "../../../services/auth";

const EMPTY: TwoDigitSummaryResponse = {
  keep: [],
  send: [],
  keep1: [],
  send1: [],
  keep2: [],
  send2: [],
};

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

export default function Report2DPage() {
  const [data, setData] = useState<TwoDigitSummaryResponse>(EMPTY);
  const [modal, setModal] = useState<"1" | "2" | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }
      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      const res = await apiClient.getTwoDigitSummaryReport(token);
      setData(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const keepTotalTop = useMemo(
    () => data.keep.reduce((s, r) => s + Number(r.two_top || 0), 0),
    [data.keep],
  );
  const keepTotalBottom = useMemo(
    () => data.keep.reduce((s, r) => s + Number(r.two_bottom || 0), 0),
    [data.keep],
  );
  const sendTotalTop = useMemo(
    () => data.send.reduce((s, r) => s + Number(r.two_top || 0), 0),
    [data.send],
  );
  const sendTotalBottom = useMemo(
    () => data.send.reduce((s, r) => s + Number(r.two_bottom || 0), 0),
    [data.send],
  );

  const handlePDF = async (mode: "keep" | "send", group?: "1" | "2") => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");
      await apiClient.exportSummary2DPDF(token, mode, group);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const handleExcel = async (mode: "keep" | "send", group?: "1" | "2") => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");
      await apiClient.exportSummary2DExcel(token, mode, group);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[26px] bg-emerald-50 text-emerald-700">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-[24px] font-black tracking-tight text-slate-900">
                รายงานสรุปเลข 2 ตัว
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                สรุปยอดตัดเก็บ / ตัดส่ง แยกเป็น 2 ตัวบน และ 2 ตัวล่าง
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="emerald">
                  kept บน {formatMoney(keepTotalTop)}
                </Badge>
                <Badge tone="emerald">
                  kept ล่าง {formatMoney(keepTotalBottom)}
                </Badge>
                <Badge tone="sky">sent บน {formatMoney(sendTotalTop)}</Badge>
                <Badge tone="sky">
                  sent ล่าง {formatMoney(sendTotalBottom)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มกลุ่ม 1 */}
            <button
              onClick={() => setModal("1")}
              className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 hover:bg-amber-100"
            >
              กลุ่ม 1 ไม่อั้น
            </button>
            {/* ปุ่มกลุ่ม 2 */}
            <button
              onClick={() => setModal("2")}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-800 hover:bg-rose-100"
            >
              กลุ่ม 2 อั้น
            </button>
            <Link
              href="/Home"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              กลับหน้า Home
            </Link>
          </div>
        </div>
      </div>

      {/* body — รวมทั้งหมด */}
      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <SummaryCard2D
            title="สรุปยอดตัดเก็บ (kept)"
            subtitle="ยอดที่เก็บไว้กินเอง"
            pill="KEPT"
            titleClass="text-emerald-700"
            pillClass="border-emerald-200 bg-emerald-50 text-emerald-700"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            rows={data.keep}
            onPDF={() => handlePDF("keep")}
            onExcel={() => handleExcel("keep")}
          />
          <SummaryCard2D
            title="สรุปยอดตัดส่ง (sent)"
            subtitle="ยอดที่ตัดส่งเจ้ามือใหญ่"
            pill="SENT"
            titleClass="text-sky-700"
            pillClass="border-sky-200 bg-sky-50 text-sky-700"
            iconBg="bg-sky-50"
            iconColor="text-sky-700"
            rows={data.send}
            onPDF={() => handlePDF("send")}
            onExcel={() => handleExcel("send")}
          />
        </div>
      </div>

      {/* ── Modal กลุ่ม 1 ── */}
      <GroupModal
        open={modal === "1"}
        onClose={() => setModal(null)}
        group="1"
        label="กลุ่ม 1 — ไม่อั้น"
        tone="amber"
        keepRows={data.keep1}
        sendRows={data.send1}
        onPDF={handlePDF}
        onExcel={handleExcel}
      />

      {/* ── Modal กลุ่ม 2 ── */}
      <GroupModal
        open={modal === "2"}
        onClose={() => setModal(null)}
        group="2"
        label="กลุ่ม 2 — อั้น"
        tone="rose"
        keepRows={data.keep2}
        sendRows={data.send2}
        onPDF={handlePDF}
        onExcel={handleExcel}
      />
    </div>
  );
}

// ── GroupModal ────────────────────────────────────────────────────────────

function GroupModal(props: {
  open: boolean;
  onClose: () => void;
  group: "1" | "2";
  label: string;
  tone: "amber" | "rose";
  keepRows: TwoDigitSummaryRow[];
  sendRows: TwoDigitSummaryRow[];
  onPDF: (mode: "keep" | "send", group: "1" | "2") => void;
  onExcel: (mode: "keep" | "send", group: "1" | "2") => void;
}) {
  if (!props.open) return null;

  const keepRows = props.keepRows ?? [];
  const sendRows = props.sendRows ?? [];

  const keepTotal = keepRows.reduce(
    (s, r) => s + Number(r.two_top || 0) + Number(r.two_bottom || 0),
    0,
  );
  const sendTotal = sendRows.reduce(
    (s, r) => s + Number(r.two_top || 0) + Number(r.two_bottom || 0),
    0,
  );

  const headerBg =
    props.tone === "amber"
      ? "bg-amber-50 border-amber-100"
      : "bg-rose-50 border-rose-100";
  const labelCls = props.tone === "amber" ? "text-amber-800" : "text-rose-800";
  const badgeCls =
    props.tone === "amber"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-rose-100 text-rose-800 border-rose-200";

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />

      {/* modal */}
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="my-6 w-full max-w-5xl rounded-[28px] bg-white shadow-2xl">
          {/* modal header */}
          <div
            className={`flex items-center justify-between rounded-t-[28px] border-b px-6 py-5 ${headerBg}`}
          >
            <div>
              <h3 className={`text-[22px] font-black ${labelCls}`}>
                {props.label}
              </h3>
              <div className="mt-2 flex gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${badgeCls}`}
                >
                  kept รวม {formatMoney(keepTotal)}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${badgeCls}`}
                >
                  sent รวม {formatMoney(sendTotal)}
                </span>
              </div>
            </div>
            <button
              onClick={props.onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              ✕ ปิด
            </button>
          </div>

          {/* modal body — 2 card kept/sent */}
          <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-2">
            <SummaryCard2D
              title="ตัดเก็บ (kept)"
              subtitle={props.label}
              pill="KEPT"
              titleClass={
                props.tone === "amber" ? "text-amber-700" : "text-rose-700"
              }
              pillClass={
                props.tone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }
              iconBg={props.tone === "amber" ? "bg-amber-50" : "bg-rose-50"}
              iconColor={
                props.tone === "amber" ? "text-amber-700" : "text-rose-700"
              }
              rows={keepRows}
              onPDF={() => props.onPDF("keep", props.group)}
              onExcel={() => props.onExcel("keep", props.group)}
            />
            <SummaryCard2D
              title="ตัดส่ง (sent)"
              subtitle={props.label}
              pill="SENT"
              titleClass={
                props.tone === "amber" ? "text-amber-600" : "text-rose-600"
              }
              pillClass={
                props.tone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : "border-rose-200 bg-rose-50 text-rose-600"
              }
              iconBg={props.tone === "amber" ? "bg-amber-50" : "bg-rose-50"}
              iconColor={
                props.tone === "amber" ? "text-amber-600" : "text-rose-600"
              }
              rows={sendRows}
              onPDF={() => props.onPDF("send", props.group)}
              onExcel={() => props.onExcel("send", props.group)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SummaryCard2D ─────────────────────────────────────────────────────────

function SummaryCard2D(props: {
  title: string;
  subtitle: string;
  pill: string;
  titleClass: string;
  pillClass: string;
  iconBg: string;
  iconColor: string;
  rows: TwoDigitSummaryRow[];
  onPDF: () => void;
  onExcel: () => void;
}) {
  const totalTop = props.rows.reduce((s, r) => s + Number(r.two_top || 0), 0);
  const totalBottom = props.rows.reduce(
    (s, r) => s + Number(r.two_bottom || 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-16 w-16 place-items-center rounded-[24px] ${props.iconBg} ${props.iconColor}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 19V7M12 19V11M20 19V5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className={`text-[22px] font-black ${props.titleClass}`}>
              {props.title}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {props.subtitle}
            </div>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${props.pillClass}`}
        >
          {props.pill}
        </span>
      </div>

      <div className="flex items-center gap-2 border-b bg-slate-50 px-6 py-3">
        <button
          onClick={props.onPDF}
          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
        >
          🖨️ PDF
        </button>
        <button
          onClick={props.onExcel}
          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
        >
          📊 Excel
        </button>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                  เลข
                </th>
                <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                  2 ตัวบน
                </th>
                <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                  2 ตัวล่าง
                </th>
              </tr>
            </thead>
            <tbody>
              {props.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-lg font-semibold text-slate-400"
                  >
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                props.rows.map((row) => (
                  <tr
                    key={row.number}
                    className={row.is_locked ? "bg-rose-50" : "bg-white"}
                  >
                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      {row.number}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] text-slate-800">
                      {formatMoney(row.two_top)}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] text-slate-800">
                      {formatMoney(row.two_bottom)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td className="px-6 py-4 text-center text-[18px] font-black text-slate-900">
                  รวม
                </td>
                <td className="px-6 py-4 text-center text-[18px] font-black text-slate-900">
                  {formatMoney(totalTop)}
                </td>
                <td className="px-6 py-4 text-center text-[18px] font-black text-slate-900">
                  {formatMoney(totalBottom)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Badge(props: { children: React.ReactNode; tone: "emerald" | "sky" }) {
  const cls =
    props.tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  return (
    <span
      className={`rounded-full border px-4 py-1.5 text-sm font-black ${cls}`}
    >
      {props.children}
    </span>
  );
}
