import React from 'react';
import { Save, Store, Receipt, Bell, Shield, Database, Percent } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Configure your pharmacy preferences and application details.
          </p>
        </div>

        <div>
          <button className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-200">
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* SIDE NAV */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          {[
            { label: 'Store Details', icon: Store, active: true },
            { label: 'Invoice & Receipt', icon: Receipt, active: false },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Security', icon: Shield, active: false },
            { label: 'Backup & Data', icon: Database, active: false },
          ].map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                item.active 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-100'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Store Configuration</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Store Name</label>
                  <input
                    type="text"
                    defaultValue="MedFlow Pharmacy"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Contact Number</label>
                  <input
                    type="text"
                    defaultValue="+92 300 1234567"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Store Address</label>
                <input
                  type="text"
                  defaultValue="123 Health Avenue, Medical City"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Currency Symbol</label>
                  <select className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800 appearance-none">
                    <option value="PKR">Rs (PKR)</option>
                    <option value="USD">$ (USD)</option>
                    <option value="EUR">€ (EUR)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Timezone</label>
                  <select className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800 appearance-none">
                    <option>Asia/Karachi</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-3">
              <Percent size={22} className="text-primary-600" />
              Tax Configuration
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue="17"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Tax Number (NTN)</label>
                  <input
                    type="text"
                    defaultValue="1234567-8"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                    placeholder="NTN Number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">GST Number</label>
                  <input
                    type="text"
                    defaultValue="PK1234567890123"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800"
                    placeholder="GST Number"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Tax Inclusive</label>
                  <select className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3.5 rounded-xl outline-none transition-all font-semibold text-gray-800 appearance-none">
                    <option value="inclusive">Prices include tax</option>
                    <option value="exclusive">Add tax on top</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Business Rules</h2>
            
            <div className="space-y-4">
              {[
                { title: 'Enable Low Stock Alerts', desc: 'Get notified when items drop below threshold', defaultChecked: true },
                { title: 'Require Login for POS', desc: 'Staff must authenticate before accessing terminal', defaultChecked: true },
                { title: 'Allow Negative Inventory', desc: 'Can sell items that are out of stock', defaultChecked: false },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{setting.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{setting.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={setting.defaultChecked} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
