import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Icons } from '../constants';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<User>({
    name: '',
    role: 'ASM',
    phoneNumber: '',
    city: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phoneNumber && formData.city) {
      onLogin(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-400 to-gold-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-gray-900">GP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Sales Connect</h1>
          <p className="text-gold-100 text-sm mt-1">Golden Pearl Cosmetics</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Officer Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                  <Icons.User />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'ASM'})}
                  className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                    formData.role === 'ASM' 
                      ? 'bg-gold-500 text-white border-gold-500 shadow-md' 
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gold-300'
                  }`}
                >
                  ASM
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'ZSM'})}
                  className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                    formData.role === 'ZSM' 
                      ? 'bg-gold-500 text-white border-gold-500 shadow-md' 
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gold-300'
                  }`}
                >
                  ZSM
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                  placeholder="03XX-XXXXXXX"
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                  <Icons.Phone />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Region</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                  placeholder="e.g. Lahore"
                />
                 <div className="absolute left-3 top-3.5 text-gray-400">
                  <Icons.MapPin />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              Start Session <Icons.ArrowRight />
            </button>
          </form>
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-8">© {new Date().getFullYear()} Golden Pearl Cosmetics. All rights reserved.</p>
    </div>
  );
};

export default LoginView;