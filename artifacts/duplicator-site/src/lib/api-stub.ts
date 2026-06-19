// Stub API client for frontend demo
// This provides mock implementations for all API endpoints

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";

export function setBaseUrl(_url: string) {}
export function setAuthTokenGetter(_getter: () => string | null | Promise<string | null>) {}
export type AuthTokenGetter = () => string | null | Promise<string | null>;

// Mock delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockUsers: Record<string, { password: string; user: AuthUser }> = {
  "admin@duplicator.rw": {
    password: "password123",
    user: { id: 1, email: "admin@duplicator.rw", name: "Admin User", role: "admin" as UserRole, phone: "+250788123456", companyName: "Duplicator Ltd" }
  },
  "staff@duplicator.rw": {
    password: "password123",
    user: { id: 2, email: "staff@duplicator.rw", name: "Staff Member", role: "staff" as UserRole, phone: "+250788654321" }
  },
  "client@example.com": {
    password: "password123",
    user: { id: 3, email: "client@example.com", name: "John Client", role: "client" as UserRole, phone: "+250788111222", companyName: "Client Corp" }
  }
};

let currentUser: AuthUser | null = null;

const mockOrders: OrderSummary[] = [
  { id: 1, orderNumber: "ORD-001", title: "Business Cards - 500pcs", status: "delivered", subtotalAmount: 25000, itemCount: 1, createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-20T14:30:00Z", client: { id: 3, name: "John Client", email: "client@example.com" }, assignedTo: { id: 2, name: "Staff Member", email: "staff@duplicator.rw" } },
  { id: 2, orderNumber: "ORD-002", title: "Brochures - 1000pcs", status: "in_production", subtotalAmount: 150000, itemCount: 1, createdAt: "2024-01-18T09:00:00Z", updatedAt: "2024-01-19T11:00:00Z", client: { id: 3, name: "John Client", email: "client@example.com" }, assignedTo: { id: 2, name: "Staff Member", email: "staff@duplicator.rw" } },
  { id: 3, orderNumber: "ORD-003", title: "Banner - Large", status: "quoted", subtotalAmount: 80000, itemCount: 1, createdAt: "2024-01-20T14:00:00Z", updatedAt: "2024-01-20T14:00:00Z", client: { id: 4, name: "Jane Business", email: "jane@business.com" } },
  { id: 4, orderNumber: "ORD-004", title: "Letterheads - 500pcs", status: "draft", subtotalAmount: 45000, itemCount: 1, createdAt: "2024-01-21T08:00:00Z", updatedAt: "2024-01-21T08:00:00Z", client: { id: 3, name: "John Client", email: "client@example.com" } },
];

const mockInvoices: InvoiceSummary[] = [
  { id: 1, invoiceNumber: "INV-001", status: "paid", subtotalAmount: 25000, taxRatePercent: 18, taxAmount: 4500, totalAmount: 29500, amountPaid: 29500, balanceDue: 0, issueDate: "2024-01-15", dueDate: "2024-01-30", isOverdue: false, client: { id: 3, name: "John Client" }, order: { id: 1, orderNumber: "ORD-001", title: "Business Cards - 500pcs" }, createdAt: "2024-01-15T10:00:00Z" },
  { id: 2, invoiceNumber: "INV-002", status: "sent", subtotalAmount: 150000, taxRatePercent: 18, taxAmount: 27000, totalAmount: 177000, amountPaid: 0, balanceDue: 177000, issueDate: "2024-01-18", dueDate: "2024-02-18", isOverdue: true, client: { id: 3, name: "John Client" }, order: { id: 2, orderNumber: "ORD-002", title: "Brochures - 1000pcs" }, createdAt: "2024-01-18T09:00:00Z" },
];

// Auth hooks
export const getGetCurrentUserQueryKey = () => ["auth", "me"] as const;
export const getGetMeQueryKey = getGetCurrentUserQueryKey;

export const useGetCurrentUser = <TData = AuthResponse, TError = Error>(options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async (): Promise<AuthResponse> => {
      await delay(100);
      if (!currentUser) throw new Error("Not authenticated");
      return { user: currentUser };
    },
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options?.query,
  }) as ReturnType<typeof useQuery<AuthResponse, TError, TData>>;
};

export const useGetMe = useGetCurrentUser;

export const useLogin = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
      await delay(500);
      const record = mockUsers[input.email];
      if (!record || record.password !== input.password) {
        throw new Error("Invalid credentials");
      }
      currentUser = record.user;
      return { user: record.user };
    },
    ...options?.mutation,
  });
};

export const useRegister = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
      await delay(500);
      if (mockUsers[input.email]) {
        throw new Error("Email already exists");
      }
      const newUser: AuthUser = {
        id: Object.keys(mockUsers).length + 10,
        email: input.email,
        name: input.name,
        role: "client",
        phone: input.phone,
        companyName: input.companyName,
      };
      mockUsers[input.email] = { password: input.password, user: newUser };
      currentUser = newUser;
      return { user: newUser };
    },
    ...options?.mutation,
  });
};

export const useLogout = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await delay(100);
      currentUser = null;
    },
    onSuccess: () => {
      queryClient.clear();
    },
    ...options?.mutation,
  });
};

// Orders hooks
export const getListOrdersQueryKey = () => ["orders"] as const;

export const useListOrders = <TData = OrderListResponse, TError = Error>(options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getListOrdersQueryKey(),
    queryFn: async (): Promise<OrderListResponse> => {
      await delay(200);
      return { orders: mockOrders };
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<OrderListResponse, TError, TData>>;
};

export const getOrderDetailQueryKey = (id: number) => ["orders", id] as const;
export const getGetOrderDetailQueryKey = getOrderDetailQueryKey;

export const useGetOrderDetail = <TData = OrderDetail, TError = Error>(id: number, options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getOrderDetailQueryKey(id),
    queryFn: async (): Promise<OrderDetail> => {
      await delay(150);
      const order = mockOrders.find(o => o.id === id);
      if (!order) throw new Error("Order not found");
      return {
        ...order,
        items: [{ description: "Printing Service", qty: 1, unitPrice: order.subtotalAmount }],
        notes: "Standard production time",
        timeline: [
          { id: 1, status: order.status, note: "Order created", createdAt: order.createdAt, by: order.client },
        ],
      };
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<OrderDetail, TError, TData>>;
};

export const useCreateOrder = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateOrderInput }): Promise<OrderDetail> => {
      await delay(300);
      const newOrder: OrderSummary = {
        id: mockOrders.length + 1,
        orderNumber: `ORD-${String(mockOrders.length + 1).padStart(3, "0")}`,
        title: data.title,
        status: "draft",
        subtotalAmount: data.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
        itemCount: data.items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : { id: 0, name: "Unknown" },
      };
      mockOrders.push(newOrder);
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      return { ...newOrder, items: data.items, notes: data.notes || null, timeline: [] };
    },
    ...options?.mutation,
  });
};

export const useUpdateOrderStatus = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOrderStatusInput }): Promise<OrderDetail> => {
      await delay(200);
      const idx = mockOrders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Order not found");
      mockOrders[idx] = { ...mockOrders[idx], status: data.status, updatedAt: new Date().toISOString() };
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getOrderDetailQueryKey(id) });
      const order = mockOrders[idx];
      return { ...order, items: [{ description: "Printing Service", qty: 1, unitPrice: order.subtotalAmount }], notes: data.note || null, timeline: [] };
    },
    ...options?.mutation,
  });
};

// Invoices hooks
export const getListInvoicesQueryKey = () => ["invoices"] as const;

export const useListInvoices = <TData = InvoiceListResponse, TError = Error>(options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getListInvoicesQueryKey(),
    queryFn: async (): Promise<InvoiceListResponse> => {
      await delay(200);
      return { invoices: mockInvoices };
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<InvoiceListResponse, TError, TData>>;
};

export const getInvoiceDetailQueryKey = (id: number) => ["invoices", id] as const;
export const getGetInvoiceDetailQueryKey = getInvoiceDetailQueryKey;

export const useGetInvoiceDetail = <TData = InvoiceDetail, TError = Error>(id: number, options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getInvoiceDetailQueryKey(id),
    queryFn: async (): Promise<InvoiceDetail> => {
      await delay(150);
      const inv = mockInvoices.find(i => i.id === id);
      if (!inv) throw new Error("Invoice not found");
      return {
        ...inv,
        taxRatePercent: inv.taxRatePercent ?? 18,
        items: [{ description: "Printing Service", qty: 1, unitPrice: inv.subtotalAmount }],
        payments: inv.status === "paid" ? [{ id: 1, amount: inv.totalAmount, method: "momo" as const, paidAt: inv.issueDate, recordedBy: { id: 1, name: "Admin User" }, createdAt: inv.issueDate }] : [],
        sentAt: inv.status !== "draft" ? inv.issueDate : null,
        paidAt: inv.status === "paid" ? inv.issueDate : null,
      };
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<InvoiceDetail, TError, TData>>;
};

export const useCreateInvoice = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateInvoiceInput }): Promise<InvoiceDetail> => {
      await delay(300);
      const order = mockOrders.find(o => o.id === data.orderId);
      if (!order) throw new Error("Order not found");
      const taxRate = data.taxRatePercent || 18;
      const newInv: InvoiceSummary = {
        id: mockInvoices.length + 1,
        invoiceNumber: `INV-${String(mockInvoices.length + 1).padStart(3, "0")}`,
        status: "draft",
        subtotalAmount: order.subtotalAmount,
        taxRatePercent: taxRate,
        taxAmount: Math.round(order.subtotalAmount * taxRate / 100),
        totalAmount: Math.round(order.subtotalAmount * (1 + taxRate / 100)),
        amountPaid: 0,
        balanceDue: Math.round(order.subtotalAmount * (1 + taxRate / 100)),
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: data.dueDate,
        isOverdue: false,
        client: order.client,
        order: { id: order.id, orderNumber: order.orderNumber, title: order.title },
        createdAt: new Date().toISOString(),
      };
      mockInvoices.push(newInv);
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      return { ...newInv, taxRatePercent: taxRate, items: [{ description: "Printing Service", qty: 1, unitPrice: newInv.subtotalAmount }], payments: [], sentAt: null, paidAt: null };
    },
    ...options?.mutation,
  });
};

export const useRecordPayment = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RecordPaymentInput }): Promise<InvoiceDetail> => {
      await delay(300);
      const idx = mockInvoices.findIndex(i => i.id === id);
      if (idx === -1) throw new Error("Invoice not found");
      const inv = mockInvoices[idx];
      inv.amountPaid += data.amount;
      inv.balanceDue -= data.amount;
      if (inv.balanceDue <= 0) {
        inv.status = "paid";
        inv.balanceDue = 0;
      }
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getInvoiceDetailQueryKey(id) });
      return { ...inv, taxRatePercent: inv.taxRatePercent ?? 18, items: [{ description: "Printing Service", qty: 1, unitPrice: inv.subtotalAmount }], payments: [], sentAt: inv.issueDate, paidAt: inv.status === "paid" ? new Date().toISOString() : null };
    },
    ...options?.mutation,
  });
};

export const useUpdateInvoiceStatus = (options?: {
  mutation?: Parameters<typeof useMutation>[0];
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInvoiceStatusInput }): Promise<InvoiceDetail> => {
      await delay(200);
      const idx = mockInvoices.findIndex(i => i.id === id);
      if (idx === -1) throw new Error("Invoice not found");
      mockInvoices[idx].status = data.status;
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getInvoiceDetailQueryKey(id) });
      const inv = mockInvoices[idx];
      return { ...inv, taxRatePercent: inv.taxRatePercent ?? 18, items: [{ description: "Printing Service", qty: 1, unitPrice: inv.subtotalAmount }], payments: [], sentAt: inv.issueDate, paidAt: null };
    },
    ...options?.mutation,
  });
};

// Analytics hooks
export const getGetAnalyticsSummaryQueryKey = () => ["analytics", "summary"] as const;

export const useGetAnalyticsSummary = <TData = AnalyticsSummary, TError = Error>(options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getGetAnalyticsSummaryQueryKey(),
    queryFn: async (): Promise<AnalyticsSummary> => {
      await delay(200);
      return {
        generatedAt: new Date().toISOString(),
        revenue: {
          thisMonth: 4567000,
          lastMonth: 3892000,
          last12Months: [
            { month: "2024-01", amount: 4567000 },
            { month: "2023-12", amount: 3892000 },
            { month: "2023-11", amount: 2987000 },
          ]
        },
        receivables: {
          outstandingAmount: 177000,
          overdueCount: 1
        },
        orders: {
          active: 3,
          dueSoon: 2,
          byStatus: [
            { status: "draft", count: 1 },
            { status: "quoted", count: 1 },
            { status: "in_production", count: 1 },
            { status: "delivered", count: 1 },
          ]
        },
        clients: {
          total: 25,
          newThisMonth: 3,
          top: [
            { id: 3, name: "John Client", email: "client@example.com", revenue: 206500, invoiceCount: 2 }
          ]
        },
        recentOrders: mockOrders.slice(0, 5).map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          title: o.title,
          status: o.status,
          subtotalAmount: o.subtotalAmount,
          clientName: o.client.name,
          createdAt: o.createdAt
        }))
      };
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<AnalyticsSummary, TError, TData>>;
};

// ─── Tasks hooks (real API calls) ───────────────────────────────────────────

export const getListTasksQueryKey = () => ["tasks"] as const;

export const useListTasks = <TData = TaskListResponse, TError = Error>(options?: {
  query?: Parameters<typeof useQuery>[0];
}) => {
  return useQuery({
    queryKey: getListTasksQueryKey(),
    queryFn: async (): Promise<TaskListResponse> => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).error ?? `HTTP ${res.status}`); }
      return res.json();
    },
    ...options?.query,
  }) as ReturnType<typeof useQuery<TaskListResponse, TError, TData>>;
};

export const useCreateTask = (options?: { mutation?: Parameters<typeof useMutation>[0] }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateTaskInput }): Promise<TaskSummary> => {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).error ?? `HTTP ${res.status}`); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    ...options?.mutation,
  });
};

export const useUpdateTask = (options?: { mutation?: Parameters<typeof useMutation>[0] }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTaskInput }): Promise<TaskSummary> => {
      const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).error ?? `HTTP ${res.status}`); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    ...options?.mutation,
  });
};

export const useDeleteTask = (options?: { mutation?: Parameters<typeof useMutation>[0] }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }): Promise<void> => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).error ?? `HTTP ${res.status}`); }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    ...options?.mutation,
  });
};

// ─── Type exports ────────────────────────────────────────────────────────────
export interface HealthStatus { status: string }
export interface ErrorResponse { error: string }
export type UserRole = "super_admin" | "admin" | "staff" | "client";
export interface AuthUser { id: number; email: string; name: string; role: UserRole; phone?: string | null; companyName?: string | null; profilePictureUrl?: string | null }
export interface AuthResponse { user: AuthUser }
export interface RegisterInput { email: string; password: string; name: string; phone?: string; companyName?: string }
export interface LoginInput { email: string; password: string }
export type OrderStatus = "draft" | "quoted" | "approved" | "in_production" | "ready" | "delivered" | "cancelled";
export interface OrderItemLine { description: string; qty: number; unitPrice: number }
export interface OrderPartyRef { id: number; name: string; email?: string | null }
export interface OrderSummary { id: number; orderNumber: string; title: string; status: OrderStatus; subtotalAmount: number; itemCount: number; createdAt: string; updatedAt: string; client: OrderPartyRef; assignedTo?: OrderPartyRef | null }
export interface OrderStatusEvent { id: number; status: OrderStatus; note?: string | null; createdAt: string; by?: OrderPartyRef | null }
export interface OrderDetail extends OrderSummary { items: OrderItemLine[]; notes: string | null; timeline: OrderStatusEvent[] }
export interface OrderListResponse { orders: OrderSummary[] }
export interface CreateOrderInput { title: string; items: OrderItemLine[]; notes?: string; clientId?: number }
export interface UpdateOrderStatusInput { status: OrderStatus; note?: string }
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export interface InvoiceOrderRef { id: number; orderNumber: string; title: string }
export interface InvoiceSummary { id: number; invoiceNumber: string; status: InvoiceStatus; subtotalAmount: number; taxRatePercent?: number; taxAmount: number; totalAmount: number; amountPaid: number; balanceDue: number; issueDate: string; dueDate: string; isOverdue: boolean; client: OrderPartyRef; order: InvoiceOrderRef; createdAt: string }
export type PaymentMethod = "momo" | "airtel" | "bank_transfer" | "cash" | "other";
export interface Payment { id: number; amount: number; method: PaymentMethod; reference?: string | null; notes?: string | null; paidAt: string; recordedBy: OrderPartyRef; createdAt: string }
export interface InvoiceDetail extends Omit<InvoiceSummary, 'taxRatePercent'> { items: OrderItemLine[]; taxRatePercent: number; payments: Payment[]; notes?: string | null; sentAt?: string | null; paidAt?: string | null }
export interface InvoiceListResponse { invoices: InvoiceSummary[] }
export interface CreateInvoiceInput { orderId: number; dueDate: string; taxRatePercent?: number; notes?: string }
export interface UpdateInvoiceStatusInput { status: InvoiceStatus }
export interface RecordPaymentInput { amount: number; method: PaymentMethod; reference?: string; notes?: string; paidAt?: string }
export interface AnalyticsMonthlyRevenue { month: string; amount: number }
export interface AnalyticsOrderStatusCount { status: OrderStatus; count: number }
export interface AnalyticsTopClient { id: number; name: string; email?: string | null; revenue: number; invoiceCount: number }
export interface AnalyticsRecentOrder { id: number; orderNumber: string; title: string; status: OrderStatus; subtotalAmount: number; clientName: string; createdAt: string }
export interface AnalyticsSummary { generatedAt: string; revenue: { thisMonth: number; lastMonth: number; last12Months: AnalyticsMonthlyRevenue[] }; receivables: { outstandingAmount: number; overdueCount: number }; orders: { active: number; dueSoon: number; byStatus: AnalyticsOrderStatusCount[] }; clients: { total: number; newThisMonth: number; top: AnalyticsTopClient[] }; recentOrders: AnalyticsRecentOrder[] }
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export interface TaskPartyRef { id: number; name: string }
export interface TaskSummary { id: number; title: string; description?: string | null; status: TaskStatus; priority: TaskPriority; assignee?: TaskPartyRef | null; createdBy?: TaskPartyRef | null; orderId?: number | null; dueDate?: string | null; createdAt: string; updatedAt: string }
export interface TaskListResponse { tasks: TaskSummary[] }
export interface CreateTaskInput { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; assigneeId?: number | null; orderId?: number | null; dueDate?: string | null }
export interface UpdateTaskInput { title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority; assigneeId?: number | null; orderId?: number | null; dueDate?: string | null }
