const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok || data?.success === false) {
    // รองรับได้ทั้งกรณี message และ error.message
    const message =
      data?.message || data?.error?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
    throw new Error(message);
  }

  return data;
}

interface Buyer {
  _id: string;
  name: string;
  phone: string;
}

interface BuyersResponse {
  success: boolean;
  data: Buyer[];
}

type OrderItemPayload = {
  type: "special" | "quick";
  bet_type: string;
  number: string;
  amount: number;
  created_at: string;
  is_locked?: boolean; // ✅
  lock_rate?: number;
};

type CreateOrderPayload = {
  buyer_id: string;
  buyer_name?: string;
  total_amount: number;
  items: OrderItemPayload[];
};

export type RuleKind = "LOCK" | "BLOCK";

export type Rule = {
  _id: string;
  kind: RuleKind;
  digits: 2 | 3;
  number: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiResponse<T> = {
  ok?: boolean;
  success?: boolean;
  message?: string;
  error?: { message?: string };
  data?: T;
};

export type ListRulesParams = {
  kind?: RuleKind;
  digits?: 2 | 3;
  active?: boolean;
  q?: string;
};

export type CreateRulesPayload = {
  kind: RuleKind;
  digits: 2 | 3;
  numbers?: string[]; // ส่งเป็น array ก็ได้
  numbersText?: string; // หรือส่งเป็น text
};

export type CreateRulesResult = {
  matched?: number;
  upserted?: number;
  modified?: number;
  items?: Rule[];
};

export type KeepSettings = {
  three_top: number;
  three_bottom: number;
  three_tod: number;
  two_top: number;
  two_bottom: number;
};

// ✅ เพิ่ม
export type SuccessResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ReportRow = {
  number: string;
  amount: number;
  is_locked: boolean;
};

export type ReportSection = {
  keep: ReportRow[];
  send: ReportRow[];
};

export type ReportSummaryTable = {
  two_top: ReportSection;
  two_bottom: ReportSection;
  three_top: ReportSection;
  three_bottom: ReportSection;
  three_tod: ReportSection;
};

export type TwoDigitSummaryRow = {
  number: string;
  two_top: number;
  two_bottom: number;
  is_locked?: boolean;
};

export type TwoDigitSummaryResponse = {
  keep: TwoDigitSummaryRow[];
  send: TwoDigitSummaryRow[];
};

export type ThreeDigitSummaryRow = {
  number: string;
  three_top: number;
  three_bottom: number;
  three_tod: number;
  is_locked?: boolean;
};

export type ThreeDigitSummaryResponse = {
  keep: ThreeDigitSummaryRow[];
  send: ThreeDigitSummaryRow[];
};

export const apiClient = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string }>("/api/auth/login", "POST", {
      email,
      password,
    }),

  register: (email: string, password: string) =>
    apiRequest<{ message: string }>("/api/auth/register", "POST", {
      email,
      password,
    }),

  getProfile: (token: string) =>
    apiRequest<{ email: string; name?: string }>(
      "/api/auth/me",
      "GET",
      undefined,
      token,
    ),

  // ✅ ดึงรายชื่อ buyers
  getBuyers: (token: string) =>
    apiRequest<BuyersResponse>("/api/buyers", "GET", undefined, token),

  // ✅ เพิ่ม buyer
  addBuyer: (buyer: { name: string; phone: string }, token: string) =>
    apiRequest<{ data: Buyer }>("/api/buyers", "POST", buyer, token),

  // ✅ ลบ buyer
  deleteBuyer: (id: string, token: string) =>
    apiRequest(`/api/buyers/${id}`, "DELETE", undefined, token),

  addOrders: (token: string, payload: CreateOrderPayload) =>
    apiRequest<ApiResponse<{ order_id?: string }>>(
      "/api/orders",
      "POST",
      payload,
      token,
    ),

  // GET /api/rules
  getRules: (token: string, params?: ListRulesParams) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set("kind", params.kind);
    if (params?.digits) qs.set("digits", String(params.digits));
    if (typeof params?.active === "boolean")
      qs.set("active", String(params.active));
    if (params?.q) qs.set("q", params.q);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<ApiResponse<Rule[]>>(
      `/api/rules${suffix}`,
      "GET",
      undefined,
      token,
    );
  },

  // POST /api/rules
  createRules: (token: string, payload: CreateRulesPayload) =>
    apiRequest<ApiResponse<CreateRulesResult>>(
      "/api/rules",
      "POST",
      payload,
      token,
    ),

  // PATCH /api/rules/:id
  updateRule: (token: string, id: string, payload: { active: boolean }) =>
    apiRequest<ApiResponse<Rule>>(`/api/rules/${id}`, "PUT", payload, token),

  // DELETE /api/rules/:id
  deleteRule: (token: string, id: string) =>
    apiRequest<ApiResponse<null>>(
      `/api/rules/${id}`,
      "DELETE",
      undefined,
      token,
    ),

  fetchKeepSettings: (token: string) =>
    apiRequest<SuccessResponse<KeepSettings>>(
      "/api/keep-settings/fetch",
      "GET",
      undefined,
      token,
    ),

  // ✅ PUT /api/keep-settings
  updateKeepSettings: (token: string, payload: KeepSettings) =>
    apiRequest<SuccessResponse<KeepSettings>>(
      "/api/keep-settings/update",
      "PUT",
      payload,
      token,
    ),

  deleteEntries: (token: string) =>
    apiRequest(`/api/orders/delete`, "POST", undefined, token),

  getTwoDigitSummaryReport: (token: string) =>
    apiRequest<SuccessResponse<TwoDigitSummaryResponse>>(
      "/api/reports/summary/2d",
      "GET",
      undefined,
      token,
    ),

  getThreeDigitSummaryReport: (token: string) =>
    apiRequest<SuccessResponse<ThreeDigitSummaryResponse>>(
      "/api/reports/summary/3d",
      "GET",
      undefined,
      token,
    ),

  exportSummary2DExcel: async (token: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/reports/summary/2d/export-excel`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Export 2D excel failed");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report_2d.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  exportSummary3DExcel: async (token: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/reports/summary/3d/export-excel`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Export 3D excel failed");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report_3d.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
