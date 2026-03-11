"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  apiClient,
  LotteryCheckResult,
  LotteryResultForm,
} from "../../services/apiClient";
import { getToken } from "../../services/auth";
import { useAuthGuard } from "../../hooks/useAuthGuard";

const EMPTY_FORM: LotteryResultForm = {
  draw_date: "",
  three_top: "",
  two_bottom: "",
  three_bottom_1: "",
  three_bottom_2: "",
  three_bottom_3: "",
  three_bottom_4: "",
};

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

type WinnerRow = LotteryCheckResult["summary"][number]["rows"][number];
type WinnerGroup = LotteryCheckResult["summary"][number];

export default function LotteryCheckPage() {
  useAuthGuard();

  const [form, setForm] = useState<LotteryResultForm>(EMPTY_FORM);
  const [result, setResult] = useState<LotteryCheckResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<WinnerGroup | null>(null);

  useEffect(() => {
    void loadLatest();
  }, []);

  const loadLatest = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");

      const res = await apiClient.getLatestLotteryResult(token);
      if (res.data) {
        setForm({
          draw_date: res.data.draw_date || "",
          three_top: res.data.three_top || "",
          two_bottom: res.data.two_bottom || "",
          three_bottom_1: res.data.three_bottom_1 || "",
          three_bottom_2: res.data.three_bottom_2 || "",
          three_bottom_3: res.data.three_bottom_3 || "",
          three_bottom_4: res.data.three_bottom_4 || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateField = (key: keyof LotteryResultForm, value: string): void => {
    const cleaned = key === "draw_date" ? value : value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      [key]: cleaned,
    }));
  };

  const validateForm = (): string | null => {
    if (!form.draw_date.trim()) return "กรุณากรอกวันที่หวยออก/งวด";
    if (form.three_top.length !== 3)
      return "กรุณากรอกสามตัวบน / เลขท้าย 3 ตัว ให้ครบ 3 หลัก";
    if (form.two_bottom.length !== 2) return "กรุณากรอกสองตัวล่างให้ครบ 2 หลัก";
    if (form.three_bottom_1.length !== 3)
      return "กรุณากรอกสามตัวล่าง 1 ให้ครบ 3 หลัก";
    if (form.three_bottom_2.length !== 3)
      return "กรุณากรอกสามตัวล่าง 2 ให้ครบ 3 หลัก";
    if (form.three_bottom_3.length !== 3)
      return "กรุณากรอกสามตัวล่าง 3 ให้ครบ 3 หลัก";
    if (form.three_bottom_4.length !== 3)
      return "กรุณากรอกสามตัวล่าง 4 ให้ครบ 3 หลัก";
    return null;
  };

  const onSubmit = async (): Promise<void> => {
    try {
      const err = validateForm();
      if (err) {
        await Swal.fire("ข้อมูลไม่ครบ", err, "warning");
        return;
      }

      setLoading(true);

      const token = getToken();
      if (!token) throw new Error("Token not found");

      const res = await apiClient.saveAndCheckLottery(token, form);
      setResult(res.data);

      await Swal.fire(
        "สำเร็จ",
        "บันทึกผลหวยและตรวจผู้ถูกรางวัลแล้ว",
        "success",
      );
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const onReset = (): void => {
    setForm(EMPTY_FORM);
    setResult(null);
  };

  const summaryBadges = useMemo(() => {
    if (!result?.summary) return [];
    return result.summary.map((group) => ({
      label: group.bet_type,
      value: group.total_amount,
      count: group.total_count,
    }));
  }, [result]);

  const openDetail = (group: WinnerGroup): void => {
    setSelectedGroup(group);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-emerald-50 text-emerald-700">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 4h10a2 2 0 0 1 2 2v12l-3-2-4 3-4-3-3 2V6a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9h6M9 13h4"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-[26px] font-black text-slate-900">ตรวจหวย</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                บันทึกผลการออกรางวัล และตรวจผู้ถูกรางวัล
              </p>

              {summaryBadges.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {summaryBadges.map((item) => (
                    <span
                      key={item.label}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-black text-emerald-700"
                    >
                      {item.label} {formatMoney(item.value)} ({item.count})
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <Link
            href="/"
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

      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mt-6 h-44 rounded-[40px] bg-gradient-to-r from-emerald-50 via-white to-sky-50" />
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 xl:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-emerald-50 text-emerald-700">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 12h12M12 6v12"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-[22px] font-black text-emerald-800">
                    บันทึกผลหวย
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    กรุณากรอกผลหวยให้ครบทุกช่องก่อนตรวจผล
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                RESULT
              </span>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <FormRow
                  label="วันที่หวยออก/งวด"
                  value={form.draw_date}
                  onChange={(v) => updateField("draw_date", v)}
                />
                <FormRow
                  label="สามตัวบน / เลขท้าย 3 ตัว"
                  value={form.three_top}
                  onChange={(v) => updateField("three_top", v)}
                />
                <FormRow
                  label="สองตัว (ล่าง)"
                  value={form.two_bottom}
                  onChange={(v) => updateField("two_bottom", v)}
                />
                <FormRow
                  label="สามตัวล่าง 1"
                  value={form.three_bottom_1}
                  onChange={(v) => updateField("three_bottom_1", v)}
                />
                <FormRow
                  label="สามตัวล่าง 2"
                  value={form.three_bottom_2}
                  onChange={(v) => updateField("three_bottom_2", v)}
                />
                <FormRow
                  label="สามตัวล่าง 3"
                  value={form.three_bottom_3}
                  onChange={(v) => updateField("three_bottom_3", v)}
                />
                <FormRow
                  label="สามตัวล่าง 4"
                  value={form.three_bottom_4}
                  onChange={(v) => updateField("three_bottom_4", v)}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => void onSubmit()}
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white disabled:opacity-50"
                >
                  ตกลง
                </button>
                <button
                  onClick={onReset}
                  className="rounded-xl bg-rose-600 px-6 py-3 font-black text-white"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setForm(EMPTY_FORM)}
                  className="rounded-xl bg-sky-600 px-6 py-3 font-black text-white"
                >
                  ล้างค่า
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-sky-50 text-sky-700">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 19V9M12 19V5M19 19v-8"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-[22px] font-black text-sky-800">
                    ผลการตรวจหวย
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    สรุปยอดผู้ถูกรางวัล พร้อมดูรายละเอียดรายคนใน modal
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black text-sky-700">
                SUMMARY
              </span>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-200 px-4 py-4 text-center text-[18px] font-black text-slate-800">
                        ประเภทหวย
                      </th>
                      <th className="border-b border-slate-200 px-4 py-4 text-center text-[18px] font-black text-slate-800">
                        ตัวเลข
                      </th>
                      <th className="border-b border-slate-200 px-4 py-4 text-center text-[18px] font-black text-slate-800">
                        จำนวนเงิน
                      </th>
                      <th className="border-b border-slate-200 px-4 py-4 text-center text-[18px] font-black text-slate-800">
                        ดูรายละเอียด
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {!result || result.summary.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          ยังไม่มีผลการตรวจ
                        </td>
                      </tr>
                    ) : (
                      result.summary.map((group) => (
                        <tr key={group.bet_type}>
                          <td className="border-b border-slate-200 px-4 py-4 text-center text-[18px] font-black text-slate-800">
                            {group.bet_type}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-4 text-center text-slate-400">
                            -
                          </td>
                          <td className="border-b border-slate-200 px-4 py-4 text-center text-[20px] font-black text-slate-900">
                            {formatMoney(group.total_amount)}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-4 text-center">
                            <button
                              onClick={() => openDetail(group)}
                              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                            >
                              {group.total_count} รายการ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WinnerDetailModal
        open={detailOpen}
        group={selectedGroup}
        onClose={() => {
          setDetailOpen(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
}

function WinnerDetailModal(props: {
  open: boolean;
  group: WinnerGroup | null;
  onClose: () => void;
}) {
  if (!props.open || !props.group) return null;

  const total = props.group.rows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="my-6 w-full max-w-5xl rounded-[28px] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="text-[22px] font-black text-slate-900">
                รายละเอียดผู้ถูกรางวัล
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {props.group.bet_type} • รวม {formatMoney(total)} บาท •{" "}
                {props.group.total_count} รายการ
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
            <div className="overflow-x-auto rounded-[24px] border border-slate-200">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-black">
                      เลขที่ถูก
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-black">
                      จำนวนเงิน
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-black">
                      ผู้ซื้อ
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-black">
                      เวลา
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {props.group.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        ไม่มีข้อมูล
                      </td>
                    </tr>
                  ) : (
                    props.group.rows.map((row, idx) => (
                      <tr key={`${row.order_id}-${row.number}-${idx}`}>
                        <td className="border-b border-slate-200 px-4 py-3 text-center text-[18px] font-black text-slate-900">
                          {row.number}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-center text-[18px] font-bold text-slate-800">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-center text-[18px] font-semibold text-slate-700">
                          {row.buyer_name}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-center text-[16px] font-medium text-slate-500">
                          {row.created_at}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-4 text-center text-[18px] font-black text-slate-900">
                      รวม
                    </td>
                    <td className="px-4 py-4 text-center text-[18px] font-black text-slate-900">
                      {formatMoney(total)}
                    </td>
                    <td className="px-4 py-4" colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormRow(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[280px_1fr]">
      <label className="text-right text-[18px] font-black text-slate-800">
        {props.label}
      </label>

      <div className="relative">
        <input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="h-[72px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-10 pr-6 text-[30px] font-black leading-none text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>
    </div>
  );
}
