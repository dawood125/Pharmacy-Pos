import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    storeName: 'MedFlow',
    phone: '',
    address: '',
    currency: 'PKR',
    taxRate: 0,
    receiptFooter: 'Thank you for your business!'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      await api.updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      return true;
    } catch (err) {
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
