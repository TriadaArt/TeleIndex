import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const empty = {
  name: '', link: '', username: '', avatar_url: '',
  category: '', language: '', country: '', city: '',
  short_description: '', subscribers: '', er: '', price_rub: '', cpm_rub: '', growth_30d: '', last_post_at: ''
};

export default function ChannelForm(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (id){
      (async ()=>{
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/channels/${id}`);
        const ch = data.channel || data; 
        setModel({ ...empty, ...ch });
      })();
    }
  }, [id]);

  const update = (k, v) => setModel(prev => ({...prev, [k]: v}));

  const computeUsername = (link) => link.replace('https://t.me/','').replace('http://t.me/','').replace('t.me/','').replace('@','').replace(/\/$/, '');

  const submit = async (status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { ...model, username: model.username || computeUsername(model.link), status };
      if (id){
        await axios.patch(`${API}/channels/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/channels`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      navigate('/me/channels');
    } catch (e) {
      alert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{id? 'Редактировать канал':'Создать канал'}</h1>
      <div className="bg-white rounded-xl border p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Название</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.name} onChange={e=>update('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ссылка (t.me/...)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.link} onChange={e=>update('link', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.username || computeUsername(model.link)} onChange={e=>update('username', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Аватар (URL)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.avatar_url} onChange={e=>update('avatar_url', e.target.value)} />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Категория</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.category} onChange={e=>update('category', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Язык</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.language} onChange={e=>update('language', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Страна</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.country} onChange={e=>update('country', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Город</label>
            <input className="w-full border rounded-lg px-3 py-2" value={model.city} onChange={e=>update('city', e.target.value)} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Подписчики</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" value={model.subscribers} onChange={e=>update('subscribers', e.target.valueAsNumber||0)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ER (%)</label>
            <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2" value={model.er} onChange={e=>update('er', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">CPM (руб)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" value={model.cpm_rub} onChange={e=>update('cpm_rub', e.target.valueAsNumber||0)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Цена (руб)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" value={model.price_rub} onChange={e=>update('price_rub', e.target.valueAsNumber||0)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Рост 30д (%)</label>
            <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2" value={model.growth_30d} onChange={e=>update('growth_30d', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Дата последнего поста</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={(model.last_post_at||'').substring(0,10)} onChange={e=>update('last_post_at', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Короткое описание</label>
          <textarea className="w-full border rounded-lg px-3 py-2" maxLength={200} rows={3} value={model.short_description} onChange={e=>update('short_description', e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <button disabled={loading} className="tg-login" onClick={()=>submit('draft')}>Сохранить черновик</button>
          <button disabled={loading} className="tg-telega-reg" onClick={()=>submit('moderation')}>Отправить на модерацию</button>
          <button disabled={loading} className="tg-pill tg-pill-outline" onClick={()=>navigate('/me/channels')}>Отмена</button>
        </div>
      </div>
    </div>
  );
}