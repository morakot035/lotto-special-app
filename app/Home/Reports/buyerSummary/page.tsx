"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  apiClient,
  BuyerSummaryRow,
  BuyerDetailRow,
  BuyerSummaryDetailResponse,
  PaginationMeta,
} from "../../../services/apiClient";
import { getToken } from "../../../services/auth";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("th-TH");
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

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

export default function BuyerSummaryPage() {
  useAuthGuard();

  const [rows, setRows] = useState<BuyerSummaryRow[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailData, setDetailData] =
    useState<BuyerSummaryDetailResponse | null>(null);

  useEffect(() => {
    void loadList(1);
  }, []);

  const loadList = async (page: number): Promise<void> => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const res = await apiClient.getBuyerSummaries(token, page, 10);
      setRows(res.data.rows);
      setPagination(res.data.pagination);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (buyerId: string): Promise<void> => {
    try {
      setSelectedBuyerId(buyerId);
      setDetailOpen(true);
      setDetailLoading(true);

      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const res = await apiClient.getBuyerSummaryDetails(token, buyerId, 1, 50);
      setDetailData(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadDetailPage = async (page: number): Promise<void> => {
    try {
      if (!selectedBuyerId) return;

      setDetailLoading(true);

      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const res = await apiClient.getBuyerSummaryDetails(
        token,
        selectedBuyerId,
        page,
        50,
      );
      setDetailData(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-emerald-50 text-emerald-700">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-[26px] font-black text-slate-900">
                สรุปยอดผู้ซื้อ
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                ดูว่าใครซื้อหวยรวมยอดกี่บาท และกดดูเลขที่ซื้อทั้งหมดได้
              </p>
            </div>
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
          <div className="border-b bg-white px-6 py-5">
            <h2 className="text-[22px] font-black text-slate-900">
              ผู้ซื้อ / คนเดินโพยหวย
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    ลำดับที่
                  </th>
                  <th className="border-b px-4 py-4 text-left text-[18px] font-black text-slate-800">
                    ชื่อ - นามสกุล
                  </th>
                  <th className="border-b px-4 py-4 text-right text-[18px] font-black text-slate-800">
                    ยอดรวม
                  </th>
                  <th className="border-b px-4 py-4 text-center text-[18px] font-black text-slate-800">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.buyer_id}>
                      <td className="border-b px-4 py-4 text-center text-[18px] font-semibold text-slate-800">
                        {(pagination.page - 1) * pagination.pageSize +
                          index +
                          1}
                      </td>
                      <td className="border-b px-4 py-4 text-[18px] font-bold text-slate-800">
                        {row.buyer_name || "-"}
                      </td>
                      <td className="border-b px-4 py-4 text-right text-[18px] font-black text-slate-800">
                        {formatMoney(row.total_amount)}
                      </td>
                      <td className="border-b px-4 py-4 text-center">
                        <button
                          onClick={() => void openDetail(row.buyer_id)}
                          className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page) => void loadList(page)}
          />
        </div>
      </div>

      {detailOpen ? (
        <BuyerDetailModal
          open={detailOpen}
          loading={detailLoading}
          data={detailData}
          onClose={() => setDetailOpen(false)}
          onPageChange={(page) => void loadDetailPage(page)}
        />
      ) : null}
    </div>
  );
}

function Pagination(props: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t bg-white px-6 py-4">
      <div className="text-sm font-semibold text-slate-500">
        หน้า {props.page} / {props.totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => props.onChange(Math.max(1, props.page - 1))}
          disabled={props.page <= 1}
          className="rounded-xl border px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
        >
          ก่อนหน้า
        </button>
        <button
          onClick={() =>
            props.onChange(Math.min(props.totalPages, props.page + 1))
          }
          disabled={props.page >= props.totalPages}
          className="rounded-xl border px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}

function BuyerDetailModal(props: {
  open: boolean;
  loading: boolean;
  data: BuyerSummaryDetailResponse | null;
  onClose: () => void;
  onPageChange: (page: number) => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="my-6 w-full max-w-6xl rounded-[28px] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="text-[22px] font-black text-slate-900">
                รายละเอียดผู้ซื้อ
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {props.data?.buyer?.buyer_name || "-"} • รวม{" "}
                {formatMoney(props.data?.buyer?.total_amount || 0)} บาท
              </p>
            </div>

            <button
              onClick={props.onClose}
              className="rounded-full border px-4 py-2 text-sm font-black text-slate-700"
            >
              ปิด
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto p-6">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b px-4 py-3 text-left font-black">
                    วันเวลา
                  </th>
                  <th className="border-b px-4 py-3 text-left font-black">
                    ประเภท
                  </th>
                  <th className="border-b px-4 py-3 text-left font-black">
                    เลข
                  </th>
                  <th className="border-b px-4 py-3 text-right font-black">
                    ยอดซื้อ
                  </th>
                  <th className="border-b px-4 py-3 text-right font-black">
                    ตัดเก็บ
                  </th>
                  <th className="border-b px-4 py-3 text-right font-black">
                    ตัดส่ง
                  </th>
                  <th className="border-b px-4 py-3 text-center font-black">
                    หมายเหตุ
                  </th>
                </tr>
              </thead>

              <tbody>
                {!props.loading &&
                (!props.data || props.data.rows.length === 0) ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  (props.data?.rows || []).map((row, idx) => (
                    <tr key={`${row.order_id}-${row.number}-${idx}`}>
                      <td className="border-b px-4 py-3 font-semibold text-slate-700">
                        {formatDateTime(row.order_created_at)}
                      </td>
                      <td className="border-b px-4 py-3 font-bold text-slate-800">
                        {row.bet_type}
                      </td>
                      <td className="border-b px-4 py-3 font-black text-slate-900">
                        {row.number}
                      </td>
                      <td className="border-b px-4 py-3 text-right font-bold text-slate-800">
                        {formatMoney(row.amount)}
                      </td>
                      <td className="border-b px-4 py-3 text-right font-bold text-emerald-700">
                        {formatMoney(row.keep_amount)}
                      </td>
                      <td className="border-b px-4 py-3 text-right font-bold text-sky-700">
                        {formatMoney(row.send_amount)}
                      </td>
                      <td className="border-b px-4 py-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {row.is_locked ? (
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-black text-rose-700">
                              อั้น
                            </span>
                          ) : null}
                          {row.kick_mode === "FULL_SEND" ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                              เตะหมด
                            </span>
                          ) : null}
                          {row.kick_mode === "REDUCE_KEEP" ? (
                            <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-black text-orange-700">
                              เตะเพิ่ม
                            </span>
                          ) : null}
                          {!row.is_locked && !row.kick_mode ? (
                            <span className="text-slate-300">-</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={props.data?.pagination.page || 1}
            totalPages={props.data?.pagination.totalPages || 1}
            onChange={props.onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
