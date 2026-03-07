"use client";

import {
  Users,
  Keyboard,
  CheckCircle,
  Sliders,
  Ban,
  FileText,
  Hash,
  Database,
} from "lucide-react";
import LogoutButton from "../components/LogoutButton";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import { apiClient } from "../services/apiClient";
import { getToken } from "../services/auth";
import { toast } from "react-hot-toast";

const menu = [
  { title: "ผู้ซื้อ/คนเดินโพยหวย", href: "/Home/Buyers", icon: Users },
  { title: "คีย์ข้อมูลหวย", href: "/Home/Lotto", icon: Keyboard },
  // { title: "ตรวจหวย", href: "/Home/CheckLottery", icon: CheckCircle },
  { title: "ตั้งค่าตัดเก็บรายตัว", href: "/Home/Settings/Keep", icon: Sliders },
  {
    title: "ตั้งค่าเลขอั้น/ไม่รับซื้อ",
    href: "/Home/Settings/Limits",
    icon: Ban,
  },
  { title: "เตะตัดเก็บรายตัว", href: "/Home/KickRules", icon: FileText },
  { title: "สรุป 2 ตัว บน–ล่าง", href: "/Home/Reports/2d", icon: Hash },
  { title: "สรุป 3 ตัว", href: "/Home/Reports/3d", icon: Hash },
  { title: "ล้างข้อมูลหวย", href: "/home/backup", icon: Database },
];

export default function HomePage() {
  useAuthGuard();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  const handleDeleteAllEntries = async () => {
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      showLoading();
      await apiClient.deleteEntries(token);
      toast.success("ลบข้อมูลทั้งหมดสำเร็จ");
      setOpenConfirm(false);
    } catch (err) {
      console.error(err);
      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      hideLoading();
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-800">
      {/* Header */}
      <div className="mx-auto mb-12 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-wide">
          📋 เมนูจัดการระบบหวย
        </h1>
        <LogoutButton />
      </div>

      {/* Menu */}
      <section className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {menu.map(({ title, href, icon: Icon }) => {
          const isDeleteMenu = title === "ล้างข้อมูลหวย";
          return (
            <button
              key={title}
              onClick={() => {
                if (isDeleteMenu) {
                  setOpenConfirm(true);
                } else {
                  window.location.href = href;
                }
              }}
              className="group rounded-xl bg-white p-6 text-center shadow-md ring-1 ring-gray-200 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto group-hover:bg-emerald-500 group-hover:text-white transition">
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-gray-800 group-hover:text-emerald-600">
                {title}
              </p>
            </button>
          );
        })}
      </section>
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>⚠️ ยืนยันการลบข้อมูลทั้งหมด</DialogTitle>
        <DialogContent>
          คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลหวยทั้งหมด? <br />
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} disabled={deleting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteAllEntries}
            color="error"
            disabled={deleting}
          >
            {deleting ? "กำลังลบ..." : "ยืนยันลบ"}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
