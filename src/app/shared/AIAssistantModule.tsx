import React, { useState, useEffect, useRef } from 'react';
import { Zap, Send, Sparkles, Plus, Trash2, Bot, User, MapPin, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { Card, Badge } from '../App';

interface Message {
  id?: number;
  sender: 'user' | 'assistant';
  content: string;
  action_data?: {
    action: string;
    destinationNodeId?: string;
    [key: string]: any;
  } | null;
  created_at?: string;
}

interface Thread {
  id: number;
  title: string;
  created_at: string;
}

export function AIAssistantModule() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingThreads, setFetchingThreads] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setFetchingThreads(true);
    try {
      const res = await fetch('/api/ai/threads', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.data.threads) {
        setThreads(data.data.threads);
        if (data.data.threads.length > 0 && !activeThreadId) {
          selectThread(data.data.threads[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI threads:', err);
    } finally {
      setFetchingThreads(false);
    }
  };

  const selectThread = async (threadId: number) => {
    setActiveThreadId(threadId);
    try {
      const res = await fetch(`/api/ai/threads/${threadId}/messages`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.data.messages) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages for thread:', err);
    }
  };

  const createNewThread = () => {
    setActiveThreadId(null);
    setMessages([]);
  };

  const deleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/threads/${threadId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (activeThreadId === threadId) {
          createNewThread();
        }
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: Message = { sender: 'user', content: query.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          message: query.trim(),
          threadId: activeThreadId
        })
      });

      const data = await res.json();

      if (data.success && data.data.message) {
        if (!activeThreadId && data.data.threadId) {
          setActiveThreadId(data.data.threadId);
          fetchThreads();
        }
        setMessages(prev => [...prev, data.data.message]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.'
        }]);
      }
    } catch (err) {
      console.error('AI chat request failed:', err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: 'Network error connecting to AI Assistant service.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderActionCard = (actionData: any) => {
    if (!actionData || !actionData.action) return null;

    if (actionData.action === 'NAVIGATE') {
      return (
        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <MapPin size={16} /> Campus Navigation Action
          </div>
          <button
            onClick={() => alert(`Navigating to location ID: ${actionData.destinationNodeId || 'Main Campus'}`)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
          >
            Open Map Route
          </button>
        </div>
      );
    }

    if (actionData.action === 'OPEN_FEE_PAYMENT') {
      return (
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CreditCard size={16} /> Fee Payment Action
          </div>
          <button
            onClick={() => alert('Redirecting to Fee Payment Portal...')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
          >
            Pay Dues Online
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Campus Copilot</h2>
            <Badge variant="info">Production AI</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Contextual real-time assistant for attendance, timetables, fees & campus navigation.</p>
        </div>

        <button
          onClick={createNewThread}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus size={16} /> New Conversation
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Thread Sidebar */}
        <div className="w-64 hidden md:flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chat History</span>
            <button onClick={fetchThreads} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <RefreshCw size={12} className={fetchingThreads ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {threads.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No chat history yet</div>
            ) : (
              threads.map(t => (
                <div
                  key={t.id}
                  onClick={() => selectThread(t.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeThreadId === t.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-800/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate flex-1">{t.title}</span>
                  <button
                    onClick={(e) => deleteThread(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-blue-50/30 to-white dark:from-slate-900 dark:to-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto py-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Bot size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">How can I assist your campus life today?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ask questions about your attendance, schedule, fee payments, or campus navigation.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                  <button
                    onClick={() => handleSendMessage('What is my current attendance percentage?')}
                    className="text-left px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    📊 What is my current attendance?
                  </button>
                  <button
                    onClick={() => handleSendMessage("What is my class schedule today?")}
                    className="text-left px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    📅 What is my class schedule today?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Do I have any pending fee payments?')}
                    className="text-left px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    💳 Check pending fee balance
                  </button>
                  <button
                    onClick={() => handleSendMessage('Where is the Library and Science Lab?')}
                    className="text-left px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    🗺️ Where is the Library & Labs?
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 dark:bg-slate-700'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                }`}>
                  {msg.sender === 'user' ? <User size={15} /> : <Zap size={15} />}
                </div>

                <div className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm shadow-sm space-y-2 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {renderActionCard(msg.action_data)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
                  <Sparkles size={15} />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300" />
                  <span className="ml-1 font-medium">Processing request...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center max-w-4xl mx-auto shadow-sm rounded-xl"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about your attendance, timetable, fees, or campus map..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
