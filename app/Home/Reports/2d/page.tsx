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

const EMPTY: TwoDigitSummaryResponse = { keep: [], send: [] };

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

  const handlePDF = async (mode: "keep" | "send") => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");
      await apiClient.exportSummary2DPDF(token, mode);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const handleExcel = async (mode: "keep" | "send") => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");
      await apiClient.exportSummary2DExcel(token, mode);
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

      {/* body */}
      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* KEPT card */}
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

          {/* SENT card */}
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
    </div>
  );
}

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
      {/* card header */}
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

      {/* export buttons — อยู่ใต้ header ของ card นี้เลย */}
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

      {/* table */}
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
