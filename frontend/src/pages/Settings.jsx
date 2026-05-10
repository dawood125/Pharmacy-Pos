import React, { useState, useEffect } from 'react';
import { Save, Store, Percent, AlertCircle, Bell, Shield, Database } from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../common/Toast';
import { useSettings } from '../common/SettingsContext';

export default function Settings() {
  const { addToast } = useToast();
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  const [storeConfig, setStoreConfig] = useState({
    storeName: 'MedFlow Pharmacy',
    storeAddress: '',
    storePhone: '',
    currency: 'PKR',
    timezone: 'Asia/Karachi'
  });

  const [taxConfig, setTaxConfig] = useState({
    taxRate: 17,
    taxNumber: '',
    gstNumber: '',
    taxInclusive: 'exclusive'
  });

  const [businessRules, setBusinessRules] = useState({
    lowStockAlerts: true,
    requireLogin: true,
    allowNegative: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [store, tax, all] = await Promise.all([
        api.getStoreConfig(),
        api.getTaxConfig(),
        api.getSettings()
      ]);

      setStoreConfig(store);
      setTaxConfig(tax);
      if (all.lowStockAlerts !== undefined) {
        setBusinessRules({
          lowStockAlerts: all.lowStockAlerts,
          requireLogin: all.requireLogin,
          allowNegative: all.allowNegative
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsData = {
        storeName: storeConfig.storeName,
        storeAddress: storeConfig.storeAddress,
        storePhone: storeConfig.storePhone,
        currency: storeConfig.currency,
        timezone: storeConfig.timezone,
        taxRate: taxConfig.taxRate,
        taxNumber: taxConfig.taxNumber,
        gstNumber: taxConfig.gstNumber,
        taxInclusive: taxConfig.taxInclusive,
        lowStockAlerts: businessRules.lowStockAlerts,
        requireLogin: businessRules.requireLogin,
        allowNegative: businessRules.allowNegative
      };

      await updateSettings(settingsData);
      addToast('Settings saved successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'store', label: 'Store Details', icon: Store },
    { key: 'tax', label: 'Tax Config', icon: Percent },
    { key: 'business', label: 'Business Rules', icon: AlertCircle }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure your pharmacy</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-70"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={16} />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {/* Store Settings */}
          {activeTab === 'store' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b">Store Configuration</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Store Name</label>
                  <input
                    type="text"
                    value={storeConfig.storeName}
                    onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Contact Number</label>
                  <input
                    type="text"
                    value={storeConfig.storePhone}
                    onChange={(e) => setStoreConfig({ ...storeConfig, storePhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Store Address</label>
                <input
                  type="text"
                  value={storeConfig.storeAddress}
                  onChange={(e) => setStoreConfig({ ...storeConfig, storeAddress: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Currency</label>
                  <select
                    value={storeConfig.currency}
                    onChange={(e) => setStoreConfig({ ...storeConfig, currency: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  >
                    <option value="PKR">Rs (PKR)</option>
                    <option value="USD">$ (USD)</option>
                    <option value="EUR">€ (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Timezone</label>
                  <select
                    value={storeConfig.timezone}
                    onChange={(e) => setStoreConfig({ ...storeConfig, timezone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  >
                    <option>Asia/Karachi</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tax Settings */}
          {activeTab === 'tax' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b flex items-center gap-2">
                <Percent size={18} className="text-primary-600" />
                Tax Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxConfig.taxRate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, taxRate: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tax Number (NTN)</label>
                  <input
                    type="text"
                    value={taxConfig.taxNumber}
                    onChange={(e) => setTaxConfig({ ...taxConfig, taxNumber: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">GST Number</label>
                  <input
                    type="text"
                    value={taxConfig.gstNumber}
                    onChange={(e) => setTaxConfig({ ...taxConfig, gstNumber: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tax Inclusive</label>
                  <select
                    value={taxConfig.taxInclusive}
                    onChange={(e) => setTaxConfig({ ...taxConfig, taxInclusive: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium"
                  >
                    <option value="inclusive">Prices include tax</option>
                    <option value="exclusive">Add tax on top</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Business Rules */}
          {activeTab === 'business' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b">Business Rules</h2>

              <div className="space-y-3">
                {[
                  { key: 'lowStockAlerts', title: 'Low Stock Alerts', desc: 'Get notified when items drop below threshold' },
                  { key: 'requireLogin', title: 'Require Login for POS', desc: 'Staff must authenticate before using POS' },
                  { key: 'allowNegative', title: 'Allow Negative Inventory', desc: 'Can sell items that are out of stock' }
                ].map((rule) => (
                  <div key={rule.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{rule.title}</p>
                      <p className="text-xs text-gray-500">{rule.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={businessRules[rule.key]}
                        onChange={(e) => setBusinessRules({ ...businessRules, [rule.key]: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}