import { Role } from '../model/roles.enum';
export interface User {
  userId: string;
  jwtToken: string; // Assuming the JWT is returned in a 'token' field
  userName: string;
  providerId?: string | null;
  roles: Role[];
}
