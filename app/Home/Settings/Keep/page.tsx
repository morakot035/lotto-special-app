"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  apiClient,
  KeepSettings,
  SuccessResponse,
} from "../../../services/apiClient";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { getToken } from "../../../services/auth";
import { useLoading } from "../../../context/LoadingContext";

const EMPTY: KeepSettings = {
  three_top: 0,
  three_bottom: 0,
  three_tod: 0,
  two_top: 0,
  two_bottom: 0,
};

function toNonNegative(n: string): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return x < 0 ? 0 : x;
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

export default function KeepPerNumberSettingPage() {
  useAuthGuard();

  const [form, setForm] = useState<KeepSettings>(EMPTY);
  const [original, setOriginal] = useState<KeepSettings>(EMPTY);
  const { showLoading, hideLoading } = useLoading();
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        showLoading();
        const token = getToken();
        if (!token) {
          await alertAndRedirectToLogin(
            "ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน",
          );
          return;
        }

        if (isTokenExpired(token)) {
          await alertAndRedirectToLogin(
            "Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่",
          );
          return;
        }
        const res = await apiClient.fetchKeepSettings(token); // SuccessResponse<KeepSettings>
        setForm(res.data);
        setOriginal(res.data);
        setIsReady(true);
      } catch (e) {
        await Swal.fire("ผิดพลาด", String(e), "error");
      } finally {
        hideLoading();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  const onChange = (key: keyof KeepSettings, val: string) => {
    setForm((p) => ({ ...p, [key]: toNonNegative(val) }));
  };

  const onSave = async () => {
    try {
      showLoading();
      const token = getToken();
      if (!token) {
        await alertAndRedirectToLogin("ยังไม่ได้เข้าสู่ระบบ กรุณา login ก่อน");
        return;
      }

      if (isTokenExpired(token)) {
        await alertAndRedirectToLogin("Token หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      const saved = await apiClient.updateKeepSettings(token, form); // SuccessResponse<KeepSettings>
      setForm(saved.data);
      setOriginal(saved.data);
      await Swal.fire("สำเร็จ", "บันทึกตั้งค่าตัดเก็บรายตัวแล้ว", "success");
    } catch (e) {
      await Swal.fire("ผิดพลาด", String(e), "error");
    } finally {
      hideLoading();
    }
  };

  const onCancel = () => {
    setForm(original);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar (แพทเทิร์นเดียวกับหน้าคีย์ข้อมูลหวย) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 grid place-items-center text-emerald-700">
              {/* icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 8h10M7 12h10M7 16h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 3h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <div className="text-xl font-black text-slate-900">
                ตั้งค่าตัดเก็บรายตัว
              </div>
              <div className="text-sm text-slate-500">
                เก็บไว้กินเองต่อเลข 1 ตัว • ส่วนที่เกินจะเป็น “ตัดส่ง”
              </div>
            </div>
          </div>

          <Link
            href="/Home"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold
                       hover:bg-slate-50 active:scale-[0.99]
                       shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            กลับหน้า Home
          </Link>
        </div>
      </div>

      {/* Background glow คล้าย ๆ ในรูป */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto max-w-6xl px-6">
            <div className="h-40 w-full rounded-[40px] bg-gradient-to-r from-emerald-50 via-white to-sky-50 blur-0 mt-6" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-10 relative">
          <div className="grid grid-cols-1 gap-6">
            {/* Card (แพทเทิร์นเดียวกับกล่อง Buyers/ Summary) */}
            <div className="rounded-[28px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b bg-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl border border-emerald-100 bg-emerald-50 grid place-items-center text-emerald-700">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2a7 7 0 0 0-7 7v4a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 21h8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">
                      ตั้งค่าตัดเก็บรายตัว
                    </div>
                    <div className="text-sm text-slate-500">
                      ใช้สำหรับเก็บยอดไว้กินเองต่อเลข
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  KEEP SETTINGS
                </span>
              </div>

              <div className="p-6">
                <div className="rounded-2xl  bg-white p-5 shadow-sm">
                  <div className="space-y-4">
                    <Row
                      label="สามตัวบน"
                      value={form.three_top}
                      onChange={(v) => onChange("three_top", v)}
                    />
                    <Row
                      label="สามตัวล่าง"
                      value={form.three_bottom}
                      onChange={(v) => onChange("three_bottom", v)}
                    />
                    <Row
                      label="สามตัวโต๊ด"
                      value={form.three_tod}
                      onChange={(v) => onChange("three_tod", v)}
                    />
                    <Row
                      label="สองตัวบน"
                      value={form.two_top}
                      onChange={(v) => onChange("two_top", v)}
                    />
                    <Row
                      label="สองตัวล่าง"
                      value={form.two_bottom}
                      onChange={(v) => onChange("two_bottom", v)}
                    />
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={onSave}
                      disabled={!isReady || !isDirty}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 font-black text-white disabled:opacity-50"
                    >
                      ตกลง
                    </button>
                    <button
                      onClick={onCancel}
                      disabled={!isReady || !isDirty}
                      className="rounded-xl bg-rose-600 px-6 py-2.5 font-black text-white disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>

                    {!isDirty ? (
                      <div className="ml-auto text-sm text-slate-400">
                        ไม่มีการแก้ไข
                      </div>
                    ) : (
                      <div className="ml-auto text-sm font-bold text-amber-600">
                        มีการแก้ไขรอการบันทึก
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  ตัวอย่าง: ตั้งค่า “สองตัวบน = 100” • ลูกค้าซื้อ 45 สองตัวบน
                  250 → เก็บ 100 • ตัดส่ง 150
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row(props: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-4 text-sm font-extrabold text-slate-700">
        {props.label}
      </div>
      <div className="col-span-8">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={String(props.value)}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-2xl font-extrabold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
    </div>
  );
}
