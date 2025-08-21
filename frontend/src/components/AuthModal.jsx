import React, { useState } from 'react';
import Modal from './ui/modal';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthModal = ({ isOpen, onClose, initialMode = 'register', onSuccess }) => {
  const [mode, setMode] = useState(initialMode); // 'register', 'login', 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    phone: '',
    budget: 'Планируемый бюджет на запуск РК',
    agreeToTerms: false,
    agreeToProcessing: false,
    agreeToEmails: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login with existing API
        const { data } = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem("token", data.access_token);
        onSuccess && onSuccess({ name: formData.email.split('@')[0] || "Пользователь" });
      } else if (mode === 'register') {
        // Register new user
        const { data } = await axios.post(`${API}/auth/register`, {
          email: formData.email,
          password: formData.password,
          role: "admin"
        });
        
        // Auto-login after registration
        const loginResponse = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem("token", loginResponse.data.access_token);
        onSuccess && onSuccess({ 
          name: `${formData.firstName} ${formData.lastName}`.trim() || formData.email.split('@')[0] || "Пользователь"
        });
      } else if (mode === 'forgot') {
        // Password reset - placeholder for now
        setError('Функция восстановления пароля пока не реализована');
      }
    } catch (err) {
      if (mode === 'login') {
        setError('Неверные учетные данные');
      } else if (mode === 'register') {
        setError('Не удалось создать аккаунт. Возможно, пользователь уже существует.');
      } else {
        setError('Произошла ошибка. Попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Регистрация</h2>
        <p className="text-gray-600 text-lg mb-6">Создайте аккаунт администратора</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
            disabled={loading}
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full h-14 px-4 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
            disabled={loading}
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
        </div>

        <div className="mt-6 text-left text-sm text-gray-600">
          <label className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              required
              disabled={loading}
            />
            <span>
              Я согласен с условиями{' '}
              <a href="#" className="text-purple-600 underline">Пользовательского соглашения</a>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="agreeToProcessing"
              checked={formData.agreeToProcessing}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              required
              disabled={loading}
            />
            <span>
              Я даю согласие на обработку персональных данных
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.agreeToTerms || !formData.agreeToProcessing}
          className="w-full h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className="text-purple-600 hover:text-purple-700 font-medium"
            disabled={loading}
          >
            Уже есть аккаунт? Войти
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderLoginForm = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Войти</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
            disabled={loading}
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full h-14 px-4 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <div className="text-center mt-6 space-y-4">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className="block w-full text-purple-600 hover:text-purple-700 font-medium"
            disabled={loading}
          >
            Еще нет аккаунта? Зарегистрируйтесь
          </button>
          
          <button
            type="button"
            onClick={() => { setMode('forgot'); setError(''); }}
            className="block w-full text-purple-600 hover:text-purple-700 font-medium"
            disabled={loading}
          >
            Забыли пароль?
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderForgotForm = () => (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={ { duration: 0.3 }}
      className="p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Восстановить пароль</h2>
        <p className="text-gray-600 text-sm mb-8">
          Введите адрес электронной почты, и мы пришлем ссылку для восстановления пароля
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div>
          <input
            type="email"
            name="email"
            placeholder="Электронная почта"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          {loading ? 'Отправка...' : 'Восстановить пароль'}
        </button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className="text-purple-600 hover:text-purple-700 font-medium"
            disabled={loading}
          >
            Назад
          </button>
        </div>
      </form>
    </motion.div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <AnimatePresence mode="wait">
        {mode === 'register' && renderRegisterForm()}
        {mode === 'login' && renderLoginForm()}
        {mode === 'forgot' && renderForgotForm()}
      </AnimatePresence>
    </Modal>
  );
};

export default AuthModal;