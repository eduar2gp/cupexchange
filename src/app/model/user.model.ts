import { Role } from '../model/roles.enum';
export interface User {
  userId: string;
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
  municipality: string;
  province: string;
}
