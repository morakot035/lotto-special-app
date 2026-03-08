"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { apiClient, OrderItemListRow } from "../../../services/apiClient";
import { getToken } from "../../../services/auth";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

const BET_TYPE_OPTIONS = [
  "ทั้งหมด",
  "สองตัวบน",
  "สองตัวล่าง",
  "สามตัวบน",
  "สามตัวล่าง",
  "สามตัวโต๊ด",
];

const PAGE_SIZE_OPTIONS = [50, 100, 200];

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 100,
  total: 0,
  totalPages: 1,
};

export default function OrderItemsPage() {
  useAuthGuard();

  const [rows, setRows] = useState<OrderItemListRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState<boolean>(false);

  const [pageSize, setPageSize] = useState<number>(100);
  const [betType, setBetType] = useState<string>("ทั้งหมด");
  const [q, setQ] = useState<string>("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadList(1, pageSize, betType, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildKey = (row: OrderItemListRow): string =>
    `${row.order_id}__${row.item_index}`;

  const loadList = async (
    page: number,
    nextPageSize: number,
    nextBetType: string,
    nextQ: string,
  ): Promise<void> => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error("Token not found");

      const res = await apiClient.getOrderItems(token, {
        page,
        pageSize: nextPageSize,
        betType: nextBetType,
        q: nextQ,
      });

      setRows(res.data.rows);
      setPagination(res.data.pagination);
      setSelected({});
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (): Promise<void> => {
    await loadList(1, pageSize, betType, q);
  };

  const toggleRow = (row: OrderItemListRow): void => {
    const key = buildKey(row);
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedRows = rows.filter((row) => selected[buildKey(row)]);

  const onDeleteSelected = async (): Promise<void> => {
    try {
      if (selectedRows.length === 0) {
        await Swal.fire(
          "ยังไม่ได้เลือก",
          "กรุณาเลือกรายการที่ต้องการลบ",
          "warning",
        );
        return;
      }

      const confirm = await Swal.fire({
        title: `ลบ ${selectedRows.length} รายการ?`,
        text: "เมื่อลบแล้ว ระบบจะคำนวณตัดเก็บ/ตัดส่งใหม่อัตโนมัติ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบรายการ",
        cancelButtonText: "ยกเลิก",
      });

      if (!confirm.isConfirmed) return;

      const token = getToken();
      if (!token) throw new Error("Token not found");

      await apiClient.bulkDeleteOrderItems(
        token,
        selectedRows.map((row) => ({
          order_id: row.order_id,
          item_index: row.item_index,
        })),
      );

      await Swal.fire("สำเร็จ", "ลบรายการแล้ว", "success");
      await loadList(pagination.page, pageSize, betType, q);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-[26px] font-black text-slate-900">
              รายการล่าสุด
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              ค้นหา ดูรายการที่คีย์แล้ว และลบรายการที่คีย์ผิดได้
            </p>
          </div>

          <Link
            href="/Home"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            กลับหน้า Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-xl border px-4 py-3 font-bold text-slate-700"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      -&gt; {n} รายการล่าสุด ---
                    </option>
                  ))}
                </select>

                <select
                  value={betType}
                  onChange={(e) => setBetType(e.target.value)}
                  className="rounded-xl border px-4 py-3 font-bold text-slate-700"
                >
                  {BET_TYPE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      --- {item} ---
                    </option>
                  ))}
                </select>

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ค้นหาเลข / ผู้ซื้อ"
                  className="rounded-xl border px-4 py-3 font-bold text-slate-700 outline-none"
                />

                <button
                  onClick={() => void onSearch()}
                  className="rounded-xl bg-[#0f172a] px-6 py-3 font-black text-white"
                >
                  ค้นหา
                </button>
              </div>

              <button
                onClick={() => void onDeleteSelected()}
                className="rounded-xl bg-rose-600 px-6 py-3 font-black text-white"
              >
                ลบที่เลือก
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    ประเภทหวย
                  </th>
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    ตัวเลข
                  </th>
                  <th className="border-b px-4 py-4 text-right text-[18px] font-black text-slate-800">
                    จำนวนเงิน
                  </th>
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    วัน/เวลา
                  </th>
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    ผู้ซื้อ
                  </th>
                  <th className="border-b px-4 py-4 text-center text-[18px] font-black text-slate-800">
                    ลบ
                  </th>
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const key = buildKey(row);
                    return (
                      <tr key={key}>
                        <td className="border-b px-4 py-4 text-[18px] font-semibold text-slate-800">
                          {row.bet_type}
                        </td>
                        <td className="border-b px-4 py-4 text-[18px] font-black text-slate-900">
                          {row.number}
                        </td>
                        <td className="border-b px-4 py-4 text-right text-[18px] font-semibold text-slate-800">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="border-b px-4 py-4 text-[18px] font-semibold text-slate-700">
                          {row.created_at}
                        </td>
                        <td className="border-b px-4 py-4 text-[18px] font-semibold text-slate-700">
                          {row.buyer_name}
                        </td>
                        <td className="border-b px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!selected[key]}
                            onChange={() => toggleRow(row)}
                            className="h-6 w-6 rounded border-slate-300"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t bg-white px-6 py-4">
            <div className="text-sm font-semibold text-slate-500">
              หน้า {pagination.page} / {pagination.totalPages} • ทั้งหมด{" "}
              {pagination.total} รายการ
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  void loadList(
                    Math.max(1, pagination.page - 1),
                    pageSize,
                    betType,
                    q,
                  )
                }
                disabled={pagination.page <= 1}
                className="rounded-xl border px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>

              <button
                onClick={() =>
                  void loadList(
                    Math.min(pagination.totalPages, pagination.page + 1),
                    pageSize,
                    betType,
                    q,
                  )
                }
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-xl border px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
