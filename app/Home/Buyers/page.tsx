"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { apiClient } from "../../services/apiClient";
import { getToken } from "../../services/auth";
import { useLoading } from "../../context/LoadingContext";

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { showLoading, hideLoading } = useLoading();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = buyers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(buyers.length / itemsPerPage);

  useAuthGuard();

  const fetchBuyers = async () => {
    const token = getToken();
    if (!token) return;
    showLoading();
    try {
      const res = await apiClient.getBuyers(token);
      setBuyers(res.data);
    } catch (err) {
      console.error("โหลด buyers ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const addBuyer = async () => {
    if (!name.trim()) return;
    const token = getToken();
    if (!token) return;

    try {
      showLoading();

      const response = await apiClient.addBuyer({ name, phone }, token);
      const newBuyer = response.data;
      setBuyers((prev) => [...prev, newBuyer]);

      setName("");
      setPhone("");
    } catch (err) {
      console.error("เพิ่ม buyer ล้มเหลว", err);
    } finally {
      hideLoading();
    }
    setCurrentPage(1);
  };

  const removeBuyer = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      showLoading();
      await apiClient.deleteBuyer(id, token);

      setBuyers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("ลบ buyer ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <section className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* หัวข้อ */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-600">
              📋 รายชื่อผู้ซื้อ
            </h2>
            <Link
              href="/Home"
              className="text-sm text-gray-500 hover:text-emerald-500 transition"
            >
              ← กลับเมนู
            </Link>
          </div>

          {/* แบบฟอร์มเพิ่มรายชื่อ */}
          <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              ➕ เพิ่มรายชื่อใหม่
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อผู้ซื้อ"
                className="col-span-1 rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เบอร์โทร (ไม่บังคับ)"
                className="col-span-1 rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={addBuyer}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-600 active:scale-95"
              >
                เพิ่มรายชื่อ
              </button>
            </div>
          </div>

          {/* รายชื่อผู้ซื้อ */}
          <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              👥 รายชื่อทั้งหมด
            </h3>
            {currentItems.length === 0 ? (
              <p className="text-gray-400 text-sm">ยังไม่มีรายชื่อผู้ซื้อ</p>
            ) : (
              <ul className="space-y-3">
                {currentItems.map((buyer) => (
                  <li
                    key={buyer._id}
                    className="flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm hover:bg-gray-50 transition"
                  >
                    <span className="text-gray-700 font-medium">
                      {buyer.name}
                      {buyer.phone && (
                        <span className="ml-2 text-sm text-gray-400">
                          ({buyer.phone})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => removeBuyer(buyer._id)}
                      className="rounded-md p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {buyers.length > itemsPerPage && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              >
                ย้อนกลับ
              </button>
              <span className="px-2 py-1 text-gray-500">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
