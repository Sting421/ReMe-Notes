import React, { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { AuthContext, User, AuthContextType } from './AuthTypes';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('tokenType');
    const userData = localStorage.getItem('user');
    
    if (token && tokenType && userData) {
      try {
        setUser(JSON.parse(userData));
        console.log('User session restored from localStorage');
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No valid session found in localStorage');
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      
      // The response should contain token and userId
      const token = response.token;
      const tokenType = response.type; // Should be 'Bearer'
      
      const userData = {
        id: response.userId
      };
      
      // Store the auth token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('tokenType', tokenType);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update the user state
      setUser(userData);
      
      console.log('Login successful');
    } catch (apiError) {
      console.error('Login API error:', apiError);
      throw apiError;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      console.log('Attempting to register user');
      await authAPI.register(username, email, password);
      console.log('Registration successful, proceeding to login');
      
      // After registration, log the user in
      await login(username, password);
    } catch (apiError) {
      console.error('Registration API error:', apiError);
      throw apiError;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    setUser(null);
    console.log('User logged out');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
