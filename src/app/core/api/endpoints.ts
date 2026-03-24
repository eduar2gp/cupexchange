import { environment } from '../../../environments/environment';

export const ApiEndpoints = {
  base: environment.baseApiUrl,
  auth: {
    register: '/api/v1/auth/register',
    verify: '/api/v1/auth/verify',
    updateProfile: '/api/v1/auth/update/profile',
    updateFcmToken: '/api/v1/auth/update/fcm-token',
    getUserProfile: '/api/v1/auth/user/profile?userId=',
    getUserOrders: '/api/v1/auth/user/orders?userId='
  },
  merchant: {
    MERCHANT_ADD_ORDERS_ENDPOINT: '/api/v1/merchant/add-order',
    MERCHANT_GET_ORDERS: '/api/v1/merchant/orders/customer',
    MERCHANT_GET_ORDERS_BY_PROVIDER: '/api/v1/merchant/orders/',
    MERCHANT_GET_CASH_ORDERS_BY_PROVIDER: '/api/v1/merchant/cash-orders/{providerId}',
    MERCHANT_UPDATE_ORDER_STATUS: '/api/v1/merchant/update-status',
  },
  transaction: {
    USER_TRANSACTIONS_ENDPOINT: '/api/v1/transaction/user',
    DEPOSIT_ENDPOINT: '/api/v1/transaction/deposit',
    WITHDRAWAL_ENDPOINT: '/api/v1/transaction/withdraw',
    PAYMENT_GATEWAYS_ENDPOINT: '/api/v1/payment/gateways?currency=',
    ACCOUNT_BY_GATEWAY_ENDPOINT: '/api/v1/accounts/active?gatewayCode=',
    ACCOUNT_BY_USERID_AND_GATEWAY_ENDPOINT: '/api/v1/accounts/user?gatewayCode=',
    ADD_PAYMENT: '/api/v1/payment/add',
    UPDATE_RECEIPT: '/api/v1/payment/{id}/receipt',
    ACCOUNT_MANAGER_TRANSACTIONS: '/api/v1/transaction/account-manager',
    ADMIN_PROCESS: '/api/v1/transaction/admin/process'
  },
  account: {
    ADD_ACCOUNT: '/api/v1/accounts',
    ACCOUNT_PROVIDER_BALANCE: '/api/v1/accounts/providers/balances',
    GET_USER_ACCOUNTS: '/api/v1/accounts/user/{userId}',
    GET_ACCOUNT_BALANCE: '/api/v1/accounts/{accountId}/balance'
  },
  order: {
    NEW_ORDER_ENDPOINT: '/api/v1/trade/order',
    ESTIMATE_MARKET_ORDER_TOTAL_PRICE: '/api/v1/trade/estimate-market-order-total-price',
  },
  notification: {
    GET_UNSEEN_COUNT: '/api/v1/notifications/user/{userId}/unread-count',
    GET_ALL_NOTIFICATIONS: '/api/v1/notifications/user/{userId}',
    MARK_AS_SEEN: '/api/v1/notifications/{id}/seen'
  },
  provider: {
    GET_CASH_PROVIDER_BY_MUNICIPALITY: '/api/v1/providers/cash-providers/{municipalityId}'
  }
};

export const build = (path: string, params?: Record<string, string | number>) => {
  let url = `${ApiEndpoints.base}${path}`;
  
  if (params) {
    Object.keys(params).forEach(key => {
      // Replaces {userId} with the value of params.userId
      url = url.replace(`{${key}}`, params[key].toString());
    });
  }
  
  return url;
};
