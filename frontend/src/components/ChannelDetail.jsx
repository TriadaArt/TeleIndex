import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChannelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChannel();
  }, [id]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/channels/${id}`);
      setChannel(response.data);
    } catch (error) {
      console.error('Failed to load channel:', error);
      setError('Канал не найден');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Назад к каталогу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Назад к каталогу
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
              {channel?.avatar_url ? (
                <img 
                  src={channel.avatar_url} 
                  alt={channel.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                channel?.name?.substring(0, 2).toUpperCase() || 'CH'
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {channel?.name}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                {channel?.category && (
                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                    {channel.category}
                  </span>
                )}
                {channel?.language && (
                  <span>{channel.language}</span>
                )}
                {channel?.country && (
                  <span>{channel.country}</span>
                )}
              </div>
              
              {channel?.short_description && (
                <p className="text-gray-700 text-lg">
                  {channel.short_description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {channel?.subscribers?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-blue-700">Подписчиков</div>
            </div>
            
            {channel?.er && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {channel.er}%
                </div>
                <div className="text-sm text-green-700">ER</div>
              </div>
            )}
            
            {channel?.cpm_rub && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₽{channel.cpm_rub}
                </div>
                <div className="text-sm text-purple-700">CPM</div>
              </div>
            )}
            
            {channel?.price_rub && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ₽{channel.price_rub.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">Цена</div>
              </div>
            )}
          </div>

          {channel?.link && (
            <div className="text-center">
              <a 
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
              >
                Перейти к каналу
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChannelDetail;