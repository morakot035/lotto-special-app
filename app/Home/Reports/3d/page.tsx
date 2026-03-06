"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  apiClient,
  ThreeDigitSummaryResponse,
  ThreeDigitSummaryRow,
} from "../../../services/apiClient";
import { getToken } from "../../../services/auth";

const EMPTY: ThreeDigitSummaryResponse = {
  keep: [],
  send: [],
};

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function Report3DPage() {
  const [data, setData] = useState<ThreeDigitSummaryResponse>(EMPTY);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");

      const res = await apiClient.getThreeDigitSummaryReport(token);
      setData(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const keepTotalTop = useMemo(
    () => data.keep.reduce((sum, row) => sum + Number(row.three_top || 0), 0),
    [data.keep],
  );
  const keepTotalBottom = useMemo(
    () =>
      data.keep.reduce((sum, row) => sum + Number(row.three_bottom || 0), 0),
    [data.keep],
  );
  const keepTotalTod = useMemo(
    () => data.keep.reduce((sum, row) => sum + Number(row.three_tod || 0), 0),
    [data.keep],
  );

  const sendTotalTop = useMemo(
    () => data.send.reduce((sum, row) => sum + Number(row.three_top || 0), 0),
    [data.send],
  );
  const sendTotalBottom = useMemo(
    () =>
      data.send.reduce((sum, row) => sum + Number(row.three_bottom || 0), 0),
    [data.send],
  );
  const sendTotalTod = useMemo(
    () => data.send.reduce((sum, row) => sum + Number(row.three_tod || 0), 0),
    [data.send],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
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
                รายงานสรุปเลข 3 ตัว
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                สรุปยอดตัดเก็บ / ตัดส่ง แยกเป็น 3 ตัวบน 3 ตัวล่าง และ 3 ตัวโต๊ด
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="emerald">
                  kept บน {formatMoney(keepTotalTop)}
                </Badge>
                <Badge tone="emerald">
                  kept ล่าง {formatMoney(keepTotalBottom)}
                </Badge>
                <Badge tone="emerald">
                  kept โต๊ด {formatMoney(keepTotalTod)}
                </Badge>
                <Badge tone="sky">sent บน {formatMoney(sendTotalTop)}</Badge>
                <Badge tone="sky">
                  sent ล่าง {formatMoney(sendTotalBottom)}
                </Badge>
                <Badge tone="sky">sent โต๊ด {formatMoney(sendTotalTod)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/Home/Reports/2d"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              รายงาน 2 ตัว
            </Link>

            <button
              onClick={async () => {
                try {
                  const token = getToken();
                  if (!token) throw new Error("Token not found");
                  await apiClient.exportSummary3DExcel(token);
                } catch (e) {
                  await Swal.fire("ผิดพลาด", String(e), "error");
                }
              }}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-100"
            >
              Export Excel
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

      {/* bg glow */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mt-6 h-44 rounded-[40px] bg-gradient-to-r from-emerald-50 via-white to-sky-50" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <SummaryCard3D
              title="สรุปยอดตัดเก็บ (kept)"
              subtitle="ยอดที่เก็บไว้กินเอง"
              pill="KEPT"
              titleClass="text-emerald-700"
              pillClass="border-emerald-200 bg-emerald-50 text-emerald-700"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
              rows={data.keep}
            />

            <SummaryCard3D
              title="สรุปยอดตัดส่ง (sent)"
              subtitle="ยอดที่ตัดส่งเจ้ามือใหญ่"
              pill="SENT"
              titleClass="text-sky-700"
              pillClass="border-sky-200 bg-sky-50 text-sky-700"
              iconBg="bg-sky-50"
              iconColor="text-sky-700"
              rows={data.send}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard3D(props: {
  title: string;
  subtitle: string;
  pill: string;
  titleClass: string;
  pillClass: string;
  iconBg: string;
  iconColor: string;
  rows: ThreeDigitSummaryRow[];
}) {
  const totalTop = props.rows.reduce(
    (sum, row) => sum + Number(row.three_top || 0),
    0,
  );
  const totalBottom = props.rows.reduce(
    (sum, row) => sum + Number(row.three_bottom || 0),
    0,
  );
  const totalTod = props.rows.reduce(
    (sum, row) => sum + Number(row.three_tod || 0),
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
                      <div className="inline-flex items-center gap-2">
                        <span>{row.number}</span>
                        {row.is_locked ? (
                          <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white">
                            อั้น
                          </span>
                        ) : null}
                      </div>
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
