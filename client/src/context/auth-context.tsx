import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/config";

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [_, setLocation] = useLocation();

  const { data: user, isLoading: isLoadingUser, refetch } = useQuery<User | null>({
    queryKey: [API_ENDPOINTS.AUTH.USER],
    retry: false,
    refetchOnWindowFocus: false,
    // On 401, return null instead of throwing an error
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        return await res.json();
      } catch (error) {
        console.error("Auth query error:", error);
        return null;
      }
    }
  });

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isLoadingUser && !user && window.location.pathname !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoadingUser, setLocation]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", API_ENDPOINTS.AUTH.LOGIN, { username, password });
      await refetch();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", API_ENDPOINTS.AUTH.LOGOUT, {});
      await refetch();
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading: isLoading || isLoadingUser,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin"
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};