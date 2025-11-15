"use client";

import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface Message {
  id: number;
  from: 'advisor' | 'client';
  name?: string;
  text: string;
  time: string;
  avatar?: string;
  hasAttachment?: boolean;
  attachment?: string;
}

export default function MessagesPage() {
  const [message, setMessage] = useState('');

  const messages: Message[] = [
    {
      id: 1,
      from: 'advisor',
      name: 'Sophie Martin',
      text: 'Bonjour Jean, j\'ai préparé votre bilan patrimonial 2024. Je vous l\'ai envoyé dans vos documents.',
      time: 'Aujourd\'hui 10:30',
      avatar: 'SM'
    },
    {
      id: 2,
      from: 'client',
      text: 'Merci Sophie, je vais le consulter dès maintenant.',
      time: 'Aujourd\'hui 10:35'
    },
    {
      id: 3,
      from: 'advisor',
      name: 'Sophie Martin',
      text: 'N\'hésitez pas si vous avez des questions. Je reste à votre disposition.',
      time: 'Aujourd\'hui 10:36',
      avatar: 'SM'
    },
    {
      id: 4,
      from: 'advisor',
      name: 'Sophie Martin',
      text: 'J\'ai également joint une simulation pour votre projet d\'investissement locatif.',
      time: 'Aujourd\'hui 10:37',
      avatar: 'SM',
      hasAttachment: true,
      attachment: 'simulation-investissement.pdf'
    },
    {
      id: 5,
      from: 'client',
      text: 'Parfait ! Je regarde ça et je reviens vers vous si besoin.',
      time: 'Aujourd\'hui 10:40'
    }
  ];

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Envoyer le message via API Prisma
      console.log('Envoi message:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* En-tête */}
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">SM</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sophie Martin</h1>
            <p className="text-sm text-gray-500">Conseillère en Gestion de Patrimoine</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white border-x border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[70%] ${msg.from === 'client' ? 'flex-row-reverse' : ''}`}>
                {msg.from === 'advisor' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{msg.avatar}</span>
                  </div>
                )}
                
                <div>
                  {msg.from === 'advisor' && (
                    <p className="text-xs text-gray-500 mb-1">{msg.name}</p>
                  )}
                  <div className={`rounded-2xl p-4 ${
                    msg.from === 'client'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    {msg.hasAttachment && (
                      <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${
                        msg.from === 'client' ? 'bg-blue-700' : 'bg-white'
                      }`}>
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs">{msg.attachment}</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${
                    msg.from === 'client' ? 'text-right' : ''
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Votre message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}
