import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseMedical, Lock, Mail, ArrowRight } from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../common/Toast';

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await api.login(email, password);
      localStorage.setItem('user', JSON.stringify(data.user));
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 fade-in relative overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-4 rounded-2xl shadow-xl shadow-primary-500/30">
            <BriefcaseMedical size={40} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-black text-gray-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-500 uppercase tracking-widest">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-gray-200/50 sm:rounded-[2.5rem] sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleLogin}>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 focus:bg-white transition-all sm:text-sm"
                  placeholder="admin@pharmacy.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-2 transition-all active:scale-[0.98] shadow-xl shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <div className="w-2 h-2 rounded-full bg-primary-400 group-hover:animate-ping"></div>
                    </span>
                    Sign in to Workspace
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 font-medium">Secure Pharmacy Management System v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}