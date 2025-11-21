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
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    newsletter: boolean;
    notifications?: {
      email: boolean;
      push: boolean;
    };
    theme: "light" | "dark" | "auto";
    language: string;
  };
  timezone?: string;
  locale?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
}