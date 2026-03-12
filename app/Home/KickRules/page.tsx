"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { apiClient, KickRule, KickRuleMode } from "../../services/apiClient";
import { getToken } from "../../services/auth";
import { useAuthGuard } from "../../hooks/useAuthGuard";

type BetType =
  | "สองตัวบน"
  | "สองตัวล่าง"
  | "สามตัวบน"
  | "สามตัวล่าง"
  | "สามตัวโต๊ด";

const BET_TYPES: BetType[] = [
  "สองตัวบน",
  "สองตัวล่าง",
  "สามตัวบน",
  "สามตัวล่าง",
  "สามตัวโต๊ด",
];

async function alertAndRedirectToLogin(
  message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
) {
  await Swal.fire({
    icon: "warning",
    title: "⏰ หมดเวลา",
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

export default function KickRulesPage() {
  useAuthGuard();

  const [rows, setRows] = useState<KickRule[]>([]);
  const [number, setNumber] = useState("");
  const [betType, setBetType] = useState<BetType>("สองตัวบน");
  const [mode, setMode] = useState<KickRuleMode>("FULL_SEND");
  const [amount, setAmount] = useState("0");

  useEffect(() => {
    void loadRows();
  }, []);

  const loadRows = async (): Promise<void> => {
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

      const res = await apiClient.getKickRules(token);
      setRows(res.data);
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const onSave = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) return;

      await apiClient.createKickRule(token, {
        number,
        bet_type: betType,
        mode,
        amount: mode === "REDUCE_KEEP" ? Number(amount || 0) : 0,
        active: true,
      });

      setNumber("");
      setAmount("0");
      await loadRows();
      await Swal.fire("สำเร็จ", "บันทึกเตะเพิ่มแล้ว", "success");
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const onToggle = async (row: KickRule): Promise<void> => {
    try {
      const token = getToken();
      if (!token) throw new Error("Token not found");

      await apiClient.updateKickRule(token, row._id, {
        active: !row.active,
      });

      await loadRows();
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    try {
      const cf = await Swal.fire({
        title: "ลบรายการนี้?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });

      if (!cf.isConfirmed) return;

      const token = getToken();
      if (!token) throw new Error("Token not found");

      await apiClient.deleteKickRule(token, id);
      await loadRows();
      await Swal.fire("สำเร็จ", "ลบแล้ว", "success");
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-emerald-50 text-emerald-700">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M12 5v14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-[24px] font-black text-slate-900">
                ตั้งค่าเตะเพิ่ม
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                ใช้บังคับเฉพาะเลขที่ต้องการ ตัวอื่นยังเก็บปกติ
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

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">กติกาเตะเพิ่ม</h2>
            <p className="mt-1 text-sm text-slate-500">
              FULL_SEND = เตะออกหมด • REDUCE_KEEP = ลด keep ลงตามจำนวน
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="เลข เช่น 45 หรือ 234"
              className="rounded-2xl border px-4 py-3 font-bold text-slate-700 outline-none"
            />

            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value as BetType)}
              className="rounded-2xl border px-4 py-3 font-bold text-slate-700 outline-none"
            >
              {BET_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as KickRuleMode)}
              className="rounded-2xl border px-4 py-3 font-bold text-slate-700 outline-none"
            >
              <option value="FULL_SEND">เตะออกหมด</option>
              <option value="REDUCE_KEEP">เตะเพิ่มบางส่วน</option>
            </select>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={mode === "FULL_SEND"}
              placeholder="จำนวนที่เตะเพิ่ม"
              type="number"
              min={0}
              className="rounded-2xl border px-4 py-3 font-bold text-slate-700 outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => void onSave()}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white"
            >
              บันทึก
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              รายการเตะเพิ่ม
            </h2>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b px-4 py-3 text-left font-black">
                    เลข
                  </th>
                  <th className="border-b px-4 py-3 text-left font-black">
                    ประเภท
                  </th>
                  <th className="border-b px-4 py-3 text-left font-black">
                    รูปแบบ
                  </th>
                  <th className="border-b px-4 py-3 text-right font-black">
                    จำนวน
                  </th>
                  <th className="border-b px-4 py-3 text-center font-black">
                    สถานะ
                  </th>
                  <th className="border-b px-4 py-3 text-center font-black">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id}>
                      <td className="border-b px-4 py-3 font-black text-slate-800">
                        {row.number}
                      </td>
                      <td className="border-b px-4 py-3 font-bold text-slate-700">
                        {row.bet_type}
                      </td>
                      <td className="border-b px-4 py-3 font-bold text-slate-700">
                        {row.mode === "FULL_SEND"
                          ? "เตะออกหมด"
                          : "เตะเพิ่มบางส่วน"}
                      </td>
                      <td className="border-b px-4 py-3 text-right font-bold text-slate-700">
                        {row.mode === "FULL_SEND"
                          ? "-"
                          : Number(row.amount || 0).toLocaleString("th-TH")}
                      </td>
                      <td className="border-b px-4 py-3 text-center">
                        <button
                          onClick={() => void onToggle(row)}
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            row.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.active ? "ใช้งาน" : "ปิด"}
                        </button>
                      </td>
                      <td className="border-b px-4 py-3 text-center">
                        <button
                          onClick={() => void onDelete(row._id)}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700"
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
        </div>
      </div>
    </div>
  );
}
