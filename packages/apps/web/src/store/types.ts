export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}