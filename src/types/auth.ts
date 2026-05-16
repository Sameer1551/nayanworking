export interface AuthResponse {
  token?: string;
  type?: string;
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  companyName?: string;
  gstNumber?: string;
  businessAddress?: string;
  address?: string;
  message?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  phone?: string;
  preferredBranch?: string;
  gender?: string;
  city?: string;
  dateOfBirth?: string;
  anniversary?: string;
  notes?: string;
  companyName?: string;
  gstNumber?: string;
  businessAddress?: string;
  address?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  secondaryPassword?: string;
  userType: string;
  method: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  userType: string;
  address?: string;
  companyName?: string;
  gstNumber?: string;
  businessAddress?: string;
  agreeToTerms: boolean;
}
