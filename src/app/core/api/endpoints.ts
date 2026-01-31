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
     MERCHANT_ADD_ORDERS_ENDPOINT : '/api/v1/merchant/add-order',
     MERCHANT_GET_ORDERS : '/api/v1/merchant/orders/customer',
     MERCHANT_GET_ORDERS_BY_PROVIDER: '/api/v1/merchant/orders/',
     MERCHANT_UPDATE_ORDER_STATUS: '/api/v1/merchant/update-status',   
  },
  transaction: {
     USER_TRANSACTIONS_ENDPOINT : '/api/v1/transaction/user',
     DEPOSIT_ENDPOINT : '/api/v1/transaction/deposit',
     WITHDRAWAL_ENDPOINT : '/api/v1/transaction/withdraw',
  }
};

export const build = (path: string) => `${ApiEndpoints.base}${path}`;
