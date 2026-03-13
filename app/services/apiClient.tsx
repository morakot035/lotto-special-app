const BASE_URL = "http://localhost:4000";
//https://lotto-special-services.onrender.com
//http://localhost:4000
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

export type KickRuleMode = "FULL_SEND" | "REDUCE_KEEP";

export type KickRule = {
  _id: string;
  number: string;
  bet_type:
    | "สองตัวบน"
    | "สองตัวล่าง"
    | "สามตัวบน"
    | "สามตัวล่าง"
    | "สามตัวโต๊ด";
  mode: KickRuleMode;
  amount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OverallSummaryResponse = {
  two_top: number;
  two_bottom: number;
  three_top: number;
  three_bottom: number;
  three_tod: number;
  grand_total: number;
};

export type BuyerSummaryRow = {
  buyer_id: string;
  buyer_name: string;
  total_amount: number;
  order_count: number;
  last_created_at?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type BuyerSummaryListResponse = {
  rows: BuyerSummaryRow[];
  pagination: PaginationMeta;
};

export type BuyerDetailRow = {
  order_id: string;
  buyer_name: string;
  order_created_at: string;
  bet_type: string;
  number: string;
  amount: number;
  keep_amount: number;
  send_amount: number;
  is_locked: boolean;
  kick_mode: string | null;
};

export type BuyerSummaryDetailResponse = {
  buyer: {
    buyer_name: string;
    total_amount: number;
    order_count: number;
  };
  rows: BuyerDetailRow[];
  pagination: PaginationMeta;
};

export type OrderItemListRow = {
  order_id: string;
  item_index: number;
  bet_type: string;
  number: string;
  amount: number;
  created_at: string;
  buyer_name: string;
  is_locked: boolean;
  kick_mode: string | null;
};

export type OrderItemListResponse = {
  rows: OrderItemListRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type LotteryCheckGroup = {
  bet_type: string;
  total_amount: number;
  total_count: number;
  rows: LotteryCheckDetailRow[];
};

export type LotteryCheckResult = {
  result: {
    draw_date: string;
    three_top: string;
    two_top: string;
    two_bottom: string;
    three_bottom_1: string;
    three_bottom_2: string;
    three_bottom_3: string;
    three_bottom_4: string;
  };
  summary: LotteryCheckGroup[];
};

export type LotteryResultForm = {
  draw_date: string;
  three_top: string;
  two_bottom: string;
  three_bottom_1: string;
  three_bottom_2: string;
  three_bottom_3: string;
  three_bottom_4: string;
};

export type LotteryCheckDetailRow = {
  order_id: string;
  buyer_id: string;
  buyer_name: string;
  bet_type: string;
  number: string;
  amount: number;
  is_locked: boolean; // ✅ เพิ่ม
  lock_rate: number; // ✅ เพิ่ม
  created_at: string;
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

  getKickRules: (token: string) =>
    apiRequest<SuccessResponse<KickRule[]>>(
      "/api/kick-rules",
      "GET",
      undefined,
      token,
    ),

  createKickRule: (
    token: string,
    payload: {
      number: string;
      bet_type: KickRule["bet_type"];
      mode: KickRuleMode;
      amount?: number;
      active?: boolean;
    },
  ) =>
    apiRequest<SuccessResponse<KickRule>>(
      "/api/kick-rules",
      "POST",
      payload,
      token,
    ),

  updateKickRule: (
    token: string,
    id: string,
    payload: Partial<{
      number: string;
      bet_type: KickRule["bet_type"];
      mode: KickRuleMode;
      amount: number;
      active: boolean;
    }>,
  ) =>
    apiRequest<SuccessResponse<KickRule>>(
      `/api/kick-rules/${id}`,
      "PUT",
      payload,
      token,
    ),

  deleteKickRule: (token: string, id: string) =>
    apiRequest<SuccessResponse<KickRule>>(
      `/api/kick-rules/${id}`,
      "DELETE",
      undefined,
      token,
    ),

  getOverallSummaryReport: (token: string) =>
    apiRequest<SuccessResponse<OverallSummaryResponse>>(
      "/api/reports/summary/overall",
      "GET",
      undefined,
      token,
    ),

  getBuyerSummaries: (token: string, page = 1, pageSize = 10) =>
    apiRequest<SuccessResponse<BuyerSummaryListResponse>>(
      `/api/buyer-summary?page=${page}&pageSize=${pageSize}`,
      "GET",
      undefined,
      token,
    ),

  getBuyerSummaryDetails: (
    token: string,
    buyerId: string,
    page = 1,
    pageSize = 50,
  ) =>
    apiRequest<SuccessResponse<BuyerSummaryDetailResponse>>(
      `/api/buyer-summary/${buyerId}/details?page=${page}&pageSize=${pageSize}`,
      "GET",
      undefined,
      token,
    ),

  getOrderItems: (
    token: string,
    params?: {
      page?: number;
      pageSize?: number;
      betType?: string;
      q?: string;
    },
  ) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params?.betType) qs.set("betType", params.betType);
    if (params?.q) qs.set("q", params.q);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<SuccessResponse<OrderItemListResponse>>(
      `/api/order-items${suffix}`,
      "GET",
      undefined,
      token,
    );
  },

  bulkDeleteOrderItems: (
    token: string,
    items: Array<{ order_id: string; item_index: number }>,
  ) =>
    apiRequest<SuccessResponse<{ deletedCount: number; recalc: unknown }>>(
      "/api/order-items/bulk-delete",
      "POST",
      { items },
      token,
    ),

  getLatestLotteryResult: (token: string) =>
    apiRequest<SuccessResponse<LotteryResultForm | null>>(
      "/api/lottery-results/latest",
      "GET",
      undefined,
      token,
    ),

  saveAndCheckLottery: (token: string, payload: LotteryResultForm) =>
    apiRequest<SuccessResponse<LotteryCheckResult>>(
      "/api/lottery-results/check",
      "POST",
      payload,
      token,
    ),

  exportSummary2DPDF: async (token: string) => {
    const res = await fetch(`${BASE_URL}/api/reports/summary/2d/export-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export PDF failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report_2d.pdf";
    a.click();
    URL.revokeObjectURL(url);
  },

  exportSummary3DPDF: async (token: string) => {
    const res = await fetch(`${BASE_URL}/api/reports/summary/3d/export-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export PDF failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report_3d.pdf";
    a.click();
    URL.revokeObjectURL(url);
  },
};
