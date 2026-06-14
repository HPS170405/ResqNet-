import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set default auth headers for axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) { setUser(null); setLoading(false); return; }
      try {
        const res = await axios.get('http://localhost:5000/api/auth/me');
        if (res.data.success) setUser(res.data.user);
        else logout();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // login({ email, password }) — accepts an object
  const login = async ({ email, password }) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user || res.data);
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  // register({ name, email, password, role }) — accepts an object
  const register = async ({ name, email, password, role }) => {
    const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user || res.data);
    } else {
      throw new Error(res.data.message || 'Registration failed');
    }
  };

  const updateLocation = async (longitude, latitude, status) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/location', { longitude, latitude, status });
      if (res.data.success && user) {
        setUser(prev => ({ ...prev, location: res.data.location, status: res.data.status }));
      }
    } catch (err) {
      console.error('Location update error:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
};
