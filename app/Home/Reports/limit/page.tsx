"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

import {
  apiClient,
  LimitSummaryResponse,
  Limit2DRow,
  Limit3DRow,
} from "../../../services/apiClient";

import { getToken } from "../../../services/auth";

type Tab = "2d" | "3d";

const EMPTY: LimitSummaryResponse = {
  two: {
    keep: [],
    send: [],
  },
  three: {
    keep: [],
    send: [],
  },
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

export default function LimitReportPage() {
  const [tab, setTab] = useState<Tab>("2d");

  const [data, setData] = useState<LimitSummaryResponse>(EMPTY);

  // ======================================================
  // LOAD DATA
  // ======================================================

  async function loadData(): Promise<void> {
    try {
      const token = getToken();

      // ไม่มี Token
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      // Token หมดอายุ
      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      // โหลดข้อมูลสรุปเลขอั้น
      const res = await apiClient.getLimitSummaryReport(token);

      setData(res.data);
    } catch (error) {
      console.error("load limit report error:", error);

      await Swal.fire(
        "ผิดพลาด",
        error instanceof Error ? error.message : String(error),
        "error",
      );
    }
  }

  // ======================================================
  // LOAD ครั้งแรกเมื่อเปิดหน้า
  // ======================================================

  useEffect(() => {
    void loadData();

    // ต้องการโหลดครั้งแรกครั้งเดียว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePDF(
    digits: "2" | "3",
    mode: "keep" | "send",
  ): Promise<void> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Token not found");
      }

      if (digits === "2") {
        await apiClient.exportLimit2DPDF(token, mode);
      } else {
        await apiClient.exportLimit3DPDF(token, mode);
      }
    } catch (error) {
      await Swal.fire(
        "ผิดพลาด",
        error instanceof Error ? error.message : String(error),
        "error",
      );
    }
  }

  async function handleExcel(
    digits: "2" | "3",
    mode: "keep" | "send",
  ): Promise<void> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Token not found");
      }

      if (digits === "2") {
        await apiClient.exportLimit2DExcel(token, mode);
      } else {
        await apiClient.exportLimit3DExcel(token, mode);
      }
    } catch (error) {
      await Swal.fire(
        "ผิดพลาด",
        error instanceof Error ? error.message : String(error),
        "error",
      );
    }
  }

  // ======================================================
  // TOTAL : เลขอั้น 2 ตัว
  // ======================================================

  const keep2Top = useMemo(
    () => data.two.keep.reduce((sum, row) => sum + Number(row.two_top || 0), 0),
    [data.two.keep],
  );

  const keep2Bottom = useMemo(
    () =>
      data.two.keep.reduce((sum, row) => sum + Number(row.two_bottom || 0), 0),
    [data.two.keep],
  );

  const send2Top = useMemo(
    () => data.two.send.reduce((sum, row) => sum + Number(row.two_top || 0), 0),
    [data.two.send],
  );

  const send2Bottom = useMemo(
    () =>
      data.two.send.reduce((sum, row) => sum + Number(row.two_bottom || 0), 0),
    [data.two.send],
  );

  // ======================================================
  // TOTAL : เลขอั้น 3 ตัว
  // ======================================================

  const keep3Top = useMemo(
    () =>
      data.three.keep.reduce((sum, row) => sum + Number(row.three_top || 0), 0),
    [data.three.keep],
  );

  const keep3Bottom = useMemo(
    () =>
      data.three.keep.reduce(
        (sum, row) => sum + Number(row.three_bottom || 0),
        0,
      ),
    [data.three.keep],
  );

  const keep3Tod = useMemo(
    () =>
      data.three.keep.reduce((sum, row) => sum + Number(row.three_tod || 0), 0),
    [data.three.keep],
  );

  const send3Top = useMemo(
    () =>
      data.three.send.reduce((sum, row) => sum + Number(row.three_top || 0), 0),
    [data.three.send],
  );

  const send3Bottom = useMemo(
    () =>
      data.three.send.reduce(
        (sum, row) => sum + Number(row.three_bottom || 0),
        0,
      ),
    [data.three.send],
  );

  const send3Tod = useMemo(
    () =>
      data.three.send.reduce((sum, row) => sum + Number(row.three_tod || 0), 0),
    [data.three.send],
  );

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[26px] bg-rose-50 text-rose-700">
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
                รายงานสรุปเลขอั้น
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                เฉพาะเลขอั้นที่ถูกซื้อ แยกยอดตัดเก็บ / ตัดส่ง
              </p>

              {/* badge ด้านบน */}

              <div className="mt-3 flex flex-wrap gap-2">
                {tab === "2d" ? (
                  <>
                    <Badge tone="emerald">
                      kept บน {formatMoney(keep2Top)}
                    </Badge>

                    <Badge tone="emerald">
                      kept ล่าง {formatMoney(keep2Bottom)}
                    </Badge>

                    <Badge tone="sky">sent บน {formatMoney(send2Top)}</Badge>

                    <Badge tone="sky">
                      sent ล่าง {formatMoney(send2Bottom)}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge tone="emerald">
                      kept บน {formatMoney(keep3Top)}
                    </Badge>

                    <Badge tone="emerald">
                      kept ล่าง {formatMoney(keep3Bottom)}
                    </Badge>

                    <Badge tone="emerald">
                      kept โต๊ด {formatMoney(keep3Tod)}
                    </Badge>

                    <Badge tone="sky">sent บน {formatMoney(send3Top)}</Badge>

                    <Badge tone="sky">
                      sent ล่าง {formatMoney(send3Bottom)}
                    </Badge>

                    <Badge tone="sky">sent โต๊ด {formatMoney(send3Tod)}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/Home"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              ←
            </span>
            กลับหน้า Home
          </Link>
        </div>
      </div>

      {/* ========================= */}
      {/* TAB */}
      {/* ========================= */}

      <div className="mx-auto max-w-7xl px-6 pt-7">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("2d")}
            className={[
              "rounded-xl px-6 py-3 text-sm font-black transition",
              tab === "2d"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            เลขอั้น 2 ตัว
          </button>

          <button
            type="button"
            onClick={() => setTab("3d")}
            className={[
              "rounded-xl px-6 py-3 text-sm font-black transition",
              tab === "3d"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            เลขอั้น 3 ตัว
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {tab === "2d" ? (
            <>
              {/* =================== */}
              {/* 2D KEPT */}
              {/* =================== */}

              <SummaryCard2D
                title="สรุปยอดตัดเก็บ (kept)"
                subtitle="เลขอั้น 2 ตัว — ยอดที่เก็บไว้กินเอง"
                pill="KEPT"
                titleClass="text-emerald-700"
                pillClass="border-emerald-200 bg-emerald-50 text-emerald-700"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-700"
                rows={data.two.keep}
                onPDF={() => handlePDF("2", "keep")}
                onExcel={() => handleExcel("2", "keep")}
              />

              {/* =================== */}
              {/* 2D SENT */}
              {/* =================== */}

              <SummaryCard2D
                title="สรุปยอดตัดส่ง (sent)"
                subtitle="เลขอั้น 2 ตัว — ยอดที่ตัดส่งเจ้ามือใหญ่"
                pill="SENT"
                titleClass="text-sky-700"
                pillClass="border-sky-200 bg-sky-50 text-sky-700"
                iconBg="bg-sky-50"
                iconColor="text-sky-700"
                rows={data.two.send}
                onPDF={() => handlePDF("2", "send")}
                onExcel={() => handleExcel("2", "send")}
              />
            </>
          ) : (
            <>
              {/* =================== */}
              {/* 3D KEPT */}
              {/* =================== */}

              <SummaryCard3D
                title="สรุปยอดตัดเก็บ (kept)"
                subtitle="เลขอั้น 3 ตัว — ยอดที่เก็บไว้กินเอง"
                pill="KEPT"
                titleClass="text-emerald-700"
                pillClass="border-emerald-200 bg-emerald-50 text-emerald-700"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-700"
                rows={data.three.keep}
                onPDF={() => handlePDF("3", "keep")}
                onExcel={() => handleExcel("3", "keep")}
              />
              {/* =================== */}
              {/* 3D SENT */}
              {/* =================== */}

              <SummaryCard3D
                title="สรุปยอดตัดส่ง (sent)"
                subtitle="เลขอั้น 3 ตัว — ยอดที่ตัดส่งเจ้ามือใหญ่"
                pill="SENT"
                titleClass="text-sky-700"
                pillClass="border-sky-200 bg-sky-50 text-sky-700"
                iconBg="bg-sky-50"
                iconColor="text-sky-700"
                rows={data.three.send}
                onPDF={() => handlePDF("3", "send")}
                onExcel={() => handleExcel("3", "send")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// CARD 2D
// ======================================================

function SummaryCard2D(props: {
  title: string;
  subtitle: string;
  pill: string;

  titleClass: string;
  pillClass: string;

  iconBg: string;
  iconColor: string;

  rows: Limit2DRow[];
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
      {/* header */}

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

      {/* table */}

      <div className="flex items-center gap-2 border-b bg-slate-50 px-6 py-3">
        <button
          type="button"
          onClick={props.onPDF}
          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
        >
          🖨️ PDF
        </button>

        <button
          type="button"
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
                    ไม่มีข้อมูลเลขอั้นที่ถูกซื้อ
                  </td>
                </tr>
              ) : (
                props.rows.map((row) => (
                  <tr key={row.number} className="bg-rose-50">
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

// ======================================================
// CARD 3D
// ======================================================

function SummaryCard3D(props: {
  title: string;
  subtitle: string;
  pill: string;

  titleClass: string;
  pillClass: string;

  iconBg: string;
  iconColor: string;

  rows: Limit3DRow[];
  onPDF: () => void;
  onExcel: () => void;
}) {
  const totalTop = props.rows.reduce((s, r) => s + Number(r.three_top || 0), 0);

  const totalBottom = props.rows.reduce(
    (s, r) => s + Number(r.three_bottom || 0),
    0,
  );

  const totalTod = props.rows.reduce((s, r) => s + Number(r.three_tod || 0), 0);

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      {/* header */}

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

      {/* table */}

      <div className="flex items-center gap-2 border-b bg-slate-50 px-6 py-3">
        <button
          type="button"
          onClick={props.onPDF}
          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
        >
          🖨️ PDF
        </button>

        <button
          type="button"
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
                  3 ตัวบน
                </th>

                <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                  3 ตัวล่าง
                </th>

                <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                  3 ตัวโต๊ด
                </th>
              </tr>
            </thead>

            <tbody>
              {props.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-lg font-semibold text-slate-400"
                  >
                    ไม่มีข้อมูลเลขอั้นที่ถูกซื้อ
                  </td>
                </tr>
              ) : (
                props.rows.map((row) => (
                  <tr key={row.number} className="bg-rose-50">
                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      {row.number}
                    </td>

                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] text-slate-800">
                      {formatMoney(row.three_top)}
                    </td>

                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] text-slate-800">
                      {formatMoney(row.three_bottom)}
                    </td>

                    <td className="border-b border-slate-200 px-6 py-4 text-center text-[18px] text-slate-800">
                      {formatMoney(row.three_tod)}
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

                <td className="px-6 py-4 text-center text-[18px] font-black text-slate-900">
                  {formatMoney(totalTod)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// BADGE
// ======================================================

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
