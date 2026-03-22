export interface PaymentGateway {
    id?: string;
    baseCurrency?: string;  
    gatewayName?: string;
    gatewayCode?: string;
    method?: string;
}