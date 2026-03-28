import { Role } from '../model/roles.enum';
export interface User {
  id: number;
  jwtToken: string;
  username: string;
  providerId?: string | null;
  roles: Role[];
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  municipalityId?: number;
  provinceId?: number;
  profileImageUrl?: string;
}
