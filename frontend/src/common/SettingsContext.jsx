import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const SettingsContext = createContext();

const defaultSettings = {
  storeName: 'MedFlow Pharmacy',
  storeAddress: '',
  storePhone: '',
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  taxRate: 17,
  taxNumber: '',
  gstNumber: '',
  taxInclusive: 'exclusive',
  lowStockAlerts: true,
  requireLogin: true,
  allowNegative: false,
  receiptFooter: 'Thank you for your business!'
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
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
    await api.updateSettings(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
    return true;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
