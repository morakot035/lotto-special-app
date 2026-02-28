"use client";

// import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "../services/apiClient";
import { useLoading } from "../context/LoadingContext";

export const metadata = {
  title: "Login | Lotto-App",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { showLoading, hideLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    try {
      showLoading();
      const res = await apiClient.login(email, password);
      localStorage.setItem("token", res.token);
      router.replace("/Home");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เข้าสู่ระบบล้มเหลว");
      }
    } finally {
      hideLoading();
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-emerald-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full space-y-6">
        {/* โลโก้หรือชื่อแอป */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-emerald-600">Lotto App</h1>
          <p className="text-sm text-gray-500 mt-1">ระบบจัดการหวยครบวงจร</p>
        </div>

        {/* Card Login */}
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-emerald-500 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:border-emerald-500 focus:ring-emerald-400 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-600 transition"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500">
          © 2026 Lotto App. All rights reserved.
        </p>
      </div>
    </section>
  );
}
