import { AuthResponse, LoginRequest, SignupRequest, User } from '../types/auth';
import { API_BASE_URL } from '../config/apiConfig';


class AuthService {
  private baseUrl = `${API_BASE_URL}/auth`;
  private token: string | null = null;
  private user: User | null = null;
  private sessionTokenKey = 'auth_token';
  private sessionUserKey = 'auth_user';

  constructor() {
    this.token = localStorage.getItem(this.sessionTokenKey);

    const userStr = localStorage.getItem(this.sessionUserKey);
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        this.user = {
          ...parsedUser,
          userType: this.normalizeUserType(parsedUser.userType),
        };
      } catch (error) {
        console.error('AuthService: failed to parse stored user', error);
        this.user = null;
      }
    }
  }

  private normalizeUserType(userType?: string): string {
    return (userType || '').toLowerCase();
  }

  private dispatchAuthChange() {
    window.dispatchEvent(new CustomEvent('authChange'));
  }

  private persistSession(token: string | null, user: User | null) {
    this.token = token;
    this.user = user;

    if (token) {
      localStorage.setItem(this.sessionTokenKey, token);
    } else {
      localStorage.removeItem(this.sessionTokenKey);
    }

    if (user) {
      localStorage.setItem(this.sessionUserKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.sessionUserKey);
    }

    this.dispatchAuthChange();
  }

  private buildUserFromResponse(response: AuthResponse): User {
    return {
      id: Number(response.id || 0),
      firstName: response.firstName || '',
      lastName: response.lastName || '',
      email: response.email || '',
      phone: response.phone || '',
      companyName: response.companyName,
      gstNumber: response.gstNumber,
      businessAddress: response.businessAddress,
      address: response.address,
      userType: this.normalizeUserType(response.userType),
    };
  }

  /**
   * Signup - calls Java backend API
   * Backend handles:
   * - Supplier: stores in users and mirrors to data/supplier.json
   * - Customer: stores in customers
   */
  async signup(signupData: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...signupData,
          userType: signupData.userType.toLowerCase(),
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.token) {
        // Backend successfully created user and returned token
        const user = this.buildUserFromResponse(payload);
        this.persistSession(payload.token, user);

        return {
          ...payload,
          userType: user.userType,
        };
      }

      // Backend returned error
      return {
        message: payload.message || 'Registration failed',
      };
    } catch (error) {
      console.error('AuthService: signup request failed', error);
      return {
        message: 'Cannot connect to server. Please check if the backend is running.',
      };
    }
  }

  /**
   * Login - calls Java backend API
   * Backend handles:
   * - Supplier: authenticates from users with JSON fallback for legacy records
   * - Customer: authenticates from customers
   * - Admin: dual-password authentication
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...loginData,
          userType: loginData.userType.toLowerCase(),
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.token) {
        // Backend successfully authenticated and returned token
        const user = this.buildUserFromResponse(payload);
        this.persistSession(payload.token, user);

        return {
          ...payload,
          userType: user.userType,
        };
      }

      // Backend returned error
      return {
        message: payload.message || 'Invalid credentials',
      };
    } catch (error) {
      console.error('AuthService: login request failed', error);
      return {
        message: 'Cannot connect to server. Please check if the backend is running.',
      };
    }
  }

  /**
   * Validate current token with backend
   */
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const payload = await response.json();
        const user = this.buildUserFromResponse(payload);
        this.persistSession(this.token, user);
        return true;
      }

      // Token invalid, clear session
      this.persistSession(null, null);
      return false;
    } catch (error) {
      console.error('AuthService: token validation failed', error);
      return false;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  updateCurrentUser(updates: Partial<User>): User | null {
    if (!this.user) {
      return null;
    }

    const updatedUser: User = {
      ...this.user,
      ...updates,
      userType: this.normalizeUserType(updates.userType || this.user.userType),
    };

    this.persistSession(this.token, updatedUser);
    return updatedUser;
  }

  /**
   * Save profile updates to the backend
   */
  async saveProfile(updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    if (!this.token) {
      return { success: false, message: 'No authenticated session' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      const payload = await response.json();

      if (response.ok) {
        // Update local session with values returned from backend (e.g. normalized values)
        const updatedUser = this.buildUserFromResponse(payload);
        this.persistSession(this.token, updatedUser);

        return {
          success: true,
          message: 'Profile updated successfully',
        };
      }

      return {
        success: false,
        message: payload.message || 'Failed to update profile',
      };
    } catch (error) {
      console.error('AuthService: saveProfile request failed', error);
      return {
        success: false,
        message: 'Cannot connect to server. Please check if the backend is running.',
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async logout(): Promise<void> {
    // Call backend logout endpoint (optional, mainly for token blacklisting)
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      console.warn('AuthService: logout request failed (ignored)', error);
    }

    // Clear local session
    this.persistSession(null, null);
  }

  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export default new AuthService();
