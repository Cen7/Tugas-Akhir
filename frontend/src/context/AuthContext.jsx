import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch('/api/users/me', {
          method: 'GET',
          credentials: 'include' 
        });
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Gagal mengecek sesi:", err);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};