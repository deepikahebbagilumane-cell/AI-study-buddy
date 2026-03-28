import { useState, useEffect } from "react";
import { User, StudentType } from "../types";
import { authService } from "../services/auth";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setError(null);
    const result = await authService.login(email, password || "");
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      setUser(result.user);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    const result = await authService.loginWithGoogle();
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      setUser(result.user);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setError(null);
    const result = await authService.register(email, password, name);
    if (result.error) {
      setError(result.error);
      return false;
    } else if (result.user) {
      setUser(result.user);
    }
    return true;
  };

  const updateOnboarding = async (studentType: StudentType, course: string) => {
    setError(null);
    const result = await authService.updateOnboarding(studentType, course);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      setUser(result.user);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return { user, login, loginWithGoogle, register, updateOnboarding, logout, loading, error };
}
