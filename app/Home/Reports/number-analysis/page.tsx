"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import Swal from "sweetalert2";

import {
  apiClient,
  NumberAnalysisResponse,
  NumberAnalysis2DRow,
  NumberAnalysis3DRow,
} from "../../../services/apiClient";

import { getToken } from "../../../services/auth";

// ============================================================================
// TYPE
// ============================================================================

type TabType = "2d" | "3d";

type SortType = "amount" | "buyer" | "count";

type StatusFilter = "all" | "locked" | "normal";

// ============================================================================
// EMPTY
// ============================================================================

const EMPTY: NumberAnalysisResponse = {
  two: {
    rows: [],

    summary: {
      locked: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },

      normal: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },

      overall: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },
    },
  },

  three: {
    rows: [],

    summary: {
      locked: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },

      normal: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },

      overall: {
        total_amount: 0,
        number_count: 0,
        purchase_count: 0,
      },
    },
  },
};

// ============================================================================
// FORMAT
// ============================================================================

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,

    maximumFractionDigits: 2,
  });
}

// ============================================================================
// AUTH
// ============================================================================

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function redirectLogin(message: string) {
  await Swal.fire({
    icon: "warning",
    title: "ข้อความแจ้งเตือน",
    text: message,
    confirmButtonText: "ตกลง",
  });

  localStorage.removeItem("token");

  window.location.href = "/Login";
}

// ============================================================================
// PAGE
// ============================================================================

export default function NumberAnalysisPage() {
  const [tab, setTab] = useState<TabType>("2d");

  const [sortType, setSortType] = useState<SortType>("amount");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [data, setData] = useState<NumberAnalysisResponse>(EMPTY);

  const [loading, setLoading] = useState(true);

  // ==========================================================================
  // LOAD
  // ==========================================================================

  async function loadData() {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        await redirectLogin("กรุณาเข้าสู่ระบบ");

        return;
      }

      if (isTokenExpired(token)) {
        await redirectLogin("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");

        return;
      }

      const res = await apiClient.getNumberAnalysisReport(token);

      setData(res.data);
    } catch (error) {
      console.error(error);

      await Swal.fire("ผิดพลาด", String(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // FILTER + SORT 2D
  // ==========================================================================

  const rows2D = useMemo(() => {
    let rows = [...data.two.rows];

    if (statusFilter === "locked") {
      rows = rows.filter((r) => r.is_locked);
    }

    if (statusFilter === "normal") {
      rows = rows.filter((r) => !r.is_locked);
    }

    if (sortType === "amount") {
      rows.sort((a, b) => b.total_amount - a.total_amount);
    }

    if (sortType === "buyer") {
      rows.sort((a, b) => b.buyer_count - a.buyer_count);
    }

    if (sortType === "count") {
      rows.sort((a, b) => b.purchase_count - a.purchase_count);
    }

    return rows;
  }, [data.two.rows, sortType, statusFilter]);

  // ==========================================================================
  // FILTER + SORT 3D
  // ==========================================================================

  const rows3D = useMemo(() => {
    let rows = [...data.three.rows];

    if (statusFilter === "locked") {
      rows = rows.filter((r) => r.is_locked);
    }

    if (statusFilter === "normal") {
      rows = rows.filter((r) => !r.is_locked);
    }

    if (sortType === "amount") {
      rows.sort((a, b) => b.total_amount - a.total_amount);
    }

    if (sortType === "buyer") {
      rows.sort((a, b) => b.buyer_count - a.buyer_count);
    }

    if (sortType === "count") {
      rows.sort((a, b) => b.purchase_count - a.purchase_count);
    }

    return rows;
  }, [data.three.rows, sortType, statusFilter]);

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  async function exportPDF() {
    try {
      const token = getToken();

      if (!token) return;

      await apiClient.exportNumberAnalysisPDF(token, tab === "2d" ? "2" : "3");
    } catch (error) {
      await Swal.fire("ผิดพลาด", String(error), "error");
    }
  }

  async function exportExcel() {
    try {
      const token = getToken();

      if (!token) return;

      await apiClient.exportNumberAnalysisExcel(
        token,
        tab === "2d" ? "2" : "3",
      );
    } catch (error) {
      await Swal.fire("ผิดพลาด", String(error), "error");
    }
  }

  const currentSummary = tab === "2d" ? data.two.summary : data.three.summary;

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-[25px] font-black text-slate-900">
              วิเคราะห์ยอดซื้อเลข
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              ดูเลขที่มียอดซื้อสูง จำนวนผู้ซื้อ และความถี่ในการซื้อ
              เปรียบเทียบเลขอั้น / ไม่อั้น
            </p>
          </div>

          <Link
            href="/Home"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
          >
            ← กลับหน้า Home
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-7">
        {/* TAB */}

        <div className="mb-6 inline-flex rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("2d")}
            className={`rounded-[17px] px-8 py-3 text-sm font-black ${
              tab === "2d" ? "bg-rose-600 text-white" : "text-slate-600"
            }`}
          >
            เลข 2 ตัว
          </button>

          <button
            type="button"
            onClick={() => setTab("3d")}
            className={`rounded-[17px] px-8 py-3 text-sm font-black ${
              tab === "3d" ? "bg-rose-600 text-white" : "text-slate-600"
            }`}
          >
            เลข 3 ตัว
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryBox
            title="รวมทั้งหมด"
            amount={currentSummary.overall.total_amount}
            count={currentSummary.overall.number_count}
            tone="slate"
          />

          <SummaryBox
            title="เลขอั้น"
            amount={currentSummary.locked.total_amount}
            count={currentSummary.locked.number_count}
            tone="rose"
          />

          <SummaryBox
            title="เลขไม่อั้น"
            amount={currentSummary.normal.total_amount}
            count={currentSummary.normal.number_count}
            tone="emerald"
          />
        </div>

        {/* TOOLBAR */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
            >
              <option value="all">ทุกเลข</option>

              <option value="locked">เฉพาะเลขอั้น</option>

              <option value="normal">เฉพาะเลขไม่อั้น</option>
            </select>

            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
            >
              <option value="amount">ยอดซื้อสูงสุด</option>

              <option value="buyer">คนซื้อเยอะสุด</option>

              <option value="count">ซื้อบ่อยที่สุด</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void exportPDF()}
              className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-black text-rose-700"
            >
              🖨️ PDF
            </button>

            <button
              onClick={() => void exportExcel()}
              className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-700"
            >
              📊 Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[26px] bg-white p-16 text-center font-bold text-slate-400">
            กำลังโหลด...
          </div>
        ) : tab === "2d" ? (
          <Table2D rows={rows2D} />
        ) : (
          <Table3D rows={rows3D} />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// SUMMARY BOX
// ============================================================================

function SummaryBox(props: {
  title: string;
  amount: number;
  count: number;
  tone: "slate" | "rose" | "emerald";
}) {
  const cls =
    props.tone === "rose"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : props.tone === "emerald"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-white border-slate-200 text-slate-800";

  return (
    <div className={`rounded-[25px] border p-5 ${cls}`}>
      <div className="text-sm font-black">{props.title}</div>

      <div className="mt-2 text-3xl font-black">
        {formatMoney(props.amount)}
      </div>

      <div className="mt-1 text-xs font-bold opacity-70">{props.count} เลข</div>
    </div>
  );
}

// ============================================================================
// TABLE 2D
// ============================================================================

function Table2D(props: { rows: NumberAnalysis2DRow[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-slate-50">
            <tr>
              <Th>อันดับ</Th>

              <Th>เลข</Th>

              <Th>สถานะ</Th>

              <Th>2 ตัวบน</Th>

              <Th>2 ตัวล่าง</Th>

              <Th>ยอดซื้อรวม</Th>

              <Th>คนซื้อ</Th>

              <Th>จำนวนรายการ</Th>
            </tr>
          </thead>

          <tbody>
            {props.rows.map((row, index) => (
              <tr
                key={`${row.number}-${row.is_locked}`}
                className={row.is_locked ? "bg-rose-50" : "bg-white"}
              >
                <Td bold>{index + 1}</Td>

                <Td bold>{row.number}</Td>

                <Td>
                  <StatusBadge locked={row.is_locked} />
                </Td>

                <Td>{formatMoney(row.two_top)}</Td>

                <Td>{formatMoney(row.two_bottom)}</Td>

                <Td bold>{formatMoney(row.total_amount)}</Td>

                <Td bold>{row.buyer_count}</Td>

                <Td>{row.purchase_count}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TABLE 3D
// ============================================================================

function Table3D(props: { rows: NumberAnalysis3DRow[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-slate-50">
            <tr>
              <Th>อันดับ</Th>

              <Th>เลข</Th>

              <Th>สถานะ</Th>

              <Th>3 ตัวบน</Th>

              <Th>3 ตัวล่าง</Th>

              <Th>3 ตัวโต๊ด</Th>

              <Th>ยอดซื้อรวม</Th>

              <Th>คนซื้อ</Th>

              <Th>จำนวนรายการ</Th>
            </tr>
          </thead>

          <tbody>
            {props.rows.map((row, index) => (
              <tr
                key={`${row.number}-${row.is_locked}`}
                className={row.is_locked ? "bg-rose-50" : "bg-white"}
              >
                <Td bold>{index + 1}</Td>

                <Td bold>{row.number}</Td>

                <Td>
                  <StatusBadge locked={row.is_locked} />
                </Td>

                <Td>{formatMoney(row.three_top)}</Td>

                <Td>{formatMoney(row.three_bottom)}</Td>

                <Td>{formatMoney(row.three_tod)}</Td>

                <Td bold>{formatMoney(row.total_amount)}</Td>

                <Td bold>{row.buyer_count}</Td>

                <Td>{row.purchase_count}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS
// ============================================================================

function StatusBadge(props: { locked: boolean }) {
  return (
    <span
      className={
        props.locked
          ? "rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-black text-rose-700"
          : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
      }
    >
      {props.locked ? "อั้น" : "ไม่อั้น"}
    </span>
  );
}

// ============================================================================
// CELL
// ============================================================================

function Th(props: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-4 py-4 text-center text-sm font-black text-slate-800">
      {props.children}
    </th>
  );
}

function Td(props: {
  children: React.ReactNode;

  bold?: boolean;
}) {
  return (
    <td
      className={`border-b border-slate-100 px-4 py-4 text-center text-[15px] text-slate-800 ${
        props.bold ? "font-black" : "font-semibold"
      }`}
    >
      {props.children}
    </td>
  );
}
