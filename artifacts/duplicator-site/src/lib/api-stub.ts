import {
  getGetCurrentUserQueryKey,
  getGetInvoiceQueryKey,
  getGetOrderQueryKey,
  setBaseUrl,
  useGetCurrentUser,
  useGetInvoice,
  useGetOrder,
} from "@workspace/api-client-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

setBaseUrl(apiBaseUrl ? apiBaseUrl : null);

export * from "@workspace/api-client-react";

export const getGetMeQueryKey = getGetCurrentUserQueryKey;
export const useGetMe = useGetCurrentUser;
export const getGetOrderDetailQueryKey = getGetOrderQueryKey;
export const useGetOrderDetail = useGetOrder;
export const getGetInvoiceDetailQueryKey = getGetInvoiceQueryKey;
export const useGetInvoiceDetail = useGetInvoice;
