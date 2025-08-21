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
        onSuccess && onSuccess();
      } else if (mode === 'register') {
        // For now, redirect to first admin registration if available
        // In a real app, you'd implement public user registration
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
        onSuccess && onSuccess();
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
        <p className="text-gray-600 text-lg mb-6">Какая ваша основная роль?</p>
        
        <div className="flex gap-4 mb-8">
          <button 
            type="button"
            className="flex-1 py-3 px-6 border-b-2 border-green-500 text-green-600 font-medium"
          >
            Рекламодатель
          </button>
          <button 
            type="button"
            className="flex-1 py-3 px-6 text-gray-500"
          >
            Блогер
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-8">
          Функционал роли блогер также будет доступен в вашем личном кабинете
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Имя и фамилия"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Укажите электронную почту"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
          />
        </div>

        <div>
          <input
            type="tel"
            name="phone"
            placeholder="Укажите телефон"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
          />
        </div>

        <div className="relative">
          <select
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base appearance-none"
          >
            <option>Планируемый бюджет на запуск РК</option>
            <option>До 50 000 ₽</option>
            <option>50 000 - 200 000 ₽</option>
            <option>200 000 - 500 000 ₽</option>
            <option>Свыше 500 000 ₽</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="mt-6 text-left text-sm text-gray-600">
          <p className="mb-4 font-medium">У меня есть промокод</p>
          
          <label className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span>
              Я согласен с условиями{' '}
              <a href="#" className="text-purple-600 underline">Пользовательского соглашения и Оферты</a>
            </span>
          </label>

          <label className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              name="agreeToProcessing"
              checked={formData.agreeToProcessing}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span>
              Я даю{' '}
              <a href="#" className="text-purple-600 underline">согласие</a>
              {' '}на обработку персональных данных в соответствии с условиями{' '}
              <a href="#" className="text-purple-600 underline">Политики</a>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="agreeToEmails"
              checked={formData.agreeToEmails}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-purple-600 underline">
              Согласен получать информационные и/или рекламные письма
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          Зарегистрироваться
        </button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-purple-600 hover:text-purple-700 font-medium"
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
        <div>
          <input
            type="email"
            name="email"
            placeholder="Логин"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
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
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600"
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
          className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          Войти
        </button>

        <div className="text-center mt-6 space-y-4">
          <button
            type="button"
            onClick={() => setMode('register')}
            className="block w-full text-purple-600 hover:text-purple-700 font-medium"
          >
            Еще нет аккаунта? Зарегистрируйтесь
          </button>
          
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="block w-full text-purple-600 hover:text-purple-700 font-medium"
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
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Восстановить пароль</h2>
        <p className="text-gray-600 text-sm mb-8">
          Введите адрес электронной почты, и мы пришлем ссылку для восстановления пароля
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            name="email"
            placeholder="Электронная почта"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-colors duration-200 mt-8"
        >
          Восстановить пароль
        </button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-purple-600 hover:text-purple-700 font-medium"
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