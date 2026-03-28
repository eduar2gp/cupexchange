import { Municipality } from "./muncipality.model";

export interface ProviderCoveragePayload {
  providerId: number;
  providerName: string;
  activeMunicipalities: Municipality[];
}