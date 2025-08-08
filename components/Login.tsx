import React, { useState } from 'react';
import { InventoryIcon } from './icons';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="inline-block p-4 bg-teal-600/20 rounded-full mb-4">
                <InventoryIcon className="w-12 h-12 text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">ورود به سیستم انبار تسکو</h1>
            <p className="mt-2 text-gray-400">لطفا نام کاربری و رمز عبور خود را وارد کنید</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              نام کاربری
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              رمز عبور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full px-5 py-3 text-base font-medium text-center text-white bg-teal-600 rounded-lg hover:bg-teal-500 focus:ring-4 focus:ring-teal-500/50 transition-all"
          >
            ورود
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;