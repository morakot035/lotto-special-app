"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { apiClient, OverallSummaryResponse } from "../../../services/apiClient";
import { getToken } from "../../../services/auth";

const EMPTY: OverallSummaryResponse = {
  two_top: 0,
  two_bottom: 0,
  three_top: 0,
  three_bottom: 0,
  three_tod: 0,
  grand_total: 0,
};

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function ReportOverallPage() {
  const [data, setData] = useState<OverallSummaryResponse>(EMPTY);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");

      const res = await apiClient.getOverallSummaryReport(token);
      setData(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-[26px] font-black text-slate-900">
              สรุปยอดทั้งหมด
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              ไม่รวมเลขวิ่ง • แสดงยอดซื้อรวมและยอดรวมทั้งหมด
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/Home/Reports/2d"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              สรุปเลขสองตัว
            </Link>
            <Link
              href="/Home/Reports/3d"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              สรุปเลขสามตัว
            </Link>
            <Link
              href="/report/overall"
              className="rounded-full border border-slate-200 bg-[#0f172a] px-5 py-3 text-sm font-black text-white shadow-sm"
            >
              สรุปเลขทั้งหมด
            </Link>
            <Link
              href="/Home"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
            >
              กลับหน้า Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="border-b px-6 py-5 bg-white">
            <h2 className="text-[22px] font-black text-slate-900">
              สรุปยอดซื้อทั้งหมด
            </h2>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto rounded-[24px] border border-slate-200">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      สองตัวบน
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      สองตัวล่าง
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      สามตัวบน
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      สามตัวล่าง
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-center text-[18px] font-black text-slate-800">
                      สามตัวโต๊ด
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="border-b border-slate-200 px-6 py-5 text-center text-[18px] font-semibold text-slate-800">
                      {formatMoney(data.two_top)}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-5 text-center text-[18px] font-semibold text-slate-800">
                      {formatMoney(data.two_bottom)}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-5 text-center text-[18px] font-semibold text-slate-800">
                      {formatMoney(data.three_top)}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-5 text-center text-[18px] font-semibold text-slate-800">
                      {formatMoney(data.three_bottom)}
                    </td>
                    <td className="border-b border-slate-200 px-6 py-5 text-center text-[18px] font-semibold text-slate-800">
                      {formatMoney(data.three_tod)}
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr className="bg-slate-50">
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-[22px] font-black text-slate-900"
                    >
                      ยอดรวมทั้งหมด {formatMoney(data.grand_total)} บาท
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <SummaryBox
            title="รวมเลข 2 ตัว"
            value={data.two_top + data.two_bottom}
            tone="green"
          />
          <SummaryBox
            title="รวมเลข 3 ตัว"
            value={data.three_top + data.three_bottom + data.three_tod}
            tone="blue"
          />
          <SummaryBox
            title="ยอดรวมทั้งหมด"
            value={data.grand_total}
            tone="dark"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryBox(props: {
  title: string;
  value: number;
  tone: "green" | "blue" | "dark";
}) {
  const toneClass =
    props.tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : props.tone === "blue"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-[24px] border p-6 ${toneClass}`}>
      <div className="text-sm font-black">{props.title}</div>
      <div className="mt-2 text-[28px] font-black">
        {Number(props.value).toLocaleString("th-TH")}
      </div>
    </div>
  );
}
