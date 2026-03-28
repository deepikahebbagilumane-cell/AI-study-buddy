import { User, StudentType } from '../types';

const STORAGE_KEY = 'study_buddy_user';
const TOKEN_KEY = 'study_buddy_token';

export interface AuthResult {
  user?: User;
  error?: string;
  success?: boolean;
}

export const authService = {
  async login(email: string, password?: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.error) return { error: data.error };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      return { user: data.user };
    } catch (err: any) {
      return { error: "Failed to connect to server" };
    }
  },

  async loginWithGoogle(): Promise<AuthResult> {
    // For demo purposes, we'll still use a mock but we could implement real Google Auth
    const newUser: User = {
      id: 'google-user-' + Math.random().toString(36).substr(2, 9),
      name: 'Google User',
      email: 'google-user@example.com',
      role: 'user',
      onboarded: false
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { user: newUser };
  },

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (data.error) return { error: data.error };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      return { user: data.user };
    } catch (err: any) {
      return { error: "Registration failed" };
    }
  },

  async updateOnboarding(studentType: StudentType, course: string): Promise<AuthResult> {
    try {
      const user = this.getUser();
      if (!user) return { error: "User not found" };

      const response = await fetch('/api/auth/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user._id, studentType, course })
      });
      const data = await response.json();
      if (data.error) return { error: data.error };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      return { user: data.user };
    } catch (err: any) {
      return { error: "Update failed" };
    }
  },

  async logout(): Promise<AuthResult> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return { success: true };
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  }
};
