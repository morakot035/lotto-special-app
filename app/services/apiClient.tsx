const BASE_URL = "https://lotto-special-services.onrender.com";
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
  is_locked?: boolean;
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
  numbers?: string[];
  numbersText?: string;
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
  is_locked: boolean;
  lock_rate: number;
  created_at: string;
};

// ── helper: fetch HTML จาก server แล้วเปิดใน tab ใหม่ (รองรับ tablet) ────
// ส่ง Authorization header ได้ปกติ → ไม่ต้องใช้ query token
async function openHtmlInNewTab(url: string, token: string): Promise<void> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "โหลดรายงานไม่สำเร็จ");
  }
  const html = await res.text();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank");
  // คืน memory หลัง tab เปิดแล้ว
  if (win) {
    win.addEventListener("load", () => URL.revokeObjectURL(blobUrl), {
      once: true,
    });
  } else {
    // fallback: ถ้า popup blocked ให้ทำ soft redirect
    window.location.href = blobUrl;
  }
}

// ── helper: download blob file ─────────────────────────────────────────────
async function downloadBlob(
  url: string,
  token: string,
  filename: string,
): Promise<void> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "ดาวน์โหลดไม่สำเร็จ");
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

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

  getBuyers: (token: string) =>
    apiRequest<BuyersResponse>("/api/buyers", "GET", undefined, token),

  addBuyer: (buyer: { name: string; phone: string }, token: string) =>
    apiRequest<{ data: Buyer }>("/api/buyers", "POST", buyer, token),

  deleteBuyer: (id: string, token: string) =>
    apiRequest(`/api/buyers/${id}`, "DELETE", undefined, token),

  addOrders: (token: string, payload: CreateOrderPayload) =>
    apiRequest<ApiResponse<{ order_id?: string }>>(
      "/api/orders",
      "POST",
      payload,
      token,
    ),

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

  createRules: (token: string, payload: CreateRulesPayload) =>
    apiRequest<ApiResponse<CreateRulesResult>>(
      "/api/rules",
      "POST",
      payload,
      token,
    ),

  updateRule: (token: string, id: string, payload: { active: boolean }) =>
    apiRequest<ApiResponse<Rule>>(`/api/rules/${id}`, "PUT", payload, token),

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

  // ── Excel: แยก mode kept / sent ──────────────────────────────────────────

  exportSummary2DExcel: async (
    token: string,
    mode: "keep" | "send" | "all" = "all",
  ): Promise<void> => {
    const filename =
      mode === "keep"
        ? "report_2d_kept.xlsx"
        : mode === "send"
          ? "report_2d_sent.xlsx"
          : "report_2d.xlsx";
    await downloadBlob(
      `${BASE_URL}/api/reports/summary/2d/export-excel?mode=${mode}`,
      token,
      filename,
    );
  },

  exportSummary3DExcel: async (
    token: string,
    mode: "keep" | "send" | "all" = "all",
  ): Promise<void> => {
    const filename =
      mode === "keep"
        ? "report_3d_kept.xlsx"
        : mode === "send"
          ? "report_3d_sent.xlsx"
          : "report_3d.xlsx";
    await downloadBlob(
      `${BASE_URL}/api/reports/summary/3d/export-excel?mode=${mode}`,
      token,
      filename,
    );
  },

  // ── PDF: fetch HTML → เปิด tab ใหม่ → กด print/save ในเบราว์เซอร์ ───────
  // ใช้ Bearer header ปกติ ไม่ต้อง query token

  exportSummary2DPDF: async (
    token: string,
    mode: "keep" | "send" | "all" = "all",
  ): Promise<void> => {
    await openHtmlInNewTab(
      `${BASE_URL}/api/reports/summary/2d/export-pdf?mode=${mode}`,
      token,
    );
  },

  exportSummary3DPDF: async (
    token: string,
    mode: "keep" | "send" | "all" = "all",
  ): Promise<void> => {
    await openHtmlInNewTab(
      `${BASE_URL}/api/reports/summary/3d/export-pdf?mode=${mode}`,
      token,
    );
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
    params?: { page?: number; pageSize?: number; betType?: string; q?: string },
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
};
