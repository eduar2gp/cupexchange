import { environment } from '../../../environments/environment';

export const ApiEndpoints = {
  base: environment.baseApiUrl,
  auth: {
    register: '/api/v1/auth/register',
    verify: '/api/v1/auth/verify',
    updateProfile: '/api/v1/auth/update/profile',
    updateFcmToken: '/api/v1/auth/update/fcm-token',
    getUserProfile: '/api/v1/auth/user/profile?userId=',
  },
  merchant: {
     MERCHANT_ADD_ORDERS_ENDPOINT : '/api/v1/merchant/add-order',
     MERCHANT_GET_ORDERS : '/api/v1/merchant/orders/customer',
     MERCHANT_GET_ORDERS_BY_PROVIDER: '/api/v1/merchant/orders/',
     MERCHANT_UPDATE_ORDER_STATUS: '/api/v1/merchant/update-status',   
  }

};

export const build = (path: string) => `${ApiEndpoints.base}${path}`;
