import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Demo mode: sign in with a fixed demo account
      const demoEmail = 'demo@healthoperator.app';
      const demoPassword = 'demo123456';

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        // If sign in fails, create the demo account
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: { name: name.trim() || 'Пользователь' },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Health Operator</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-status-red-bg">
              <AlertCircle size={14} className="text-status-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-red">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Войти'}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Демо-режим — вход без регистрации
        </p>
      </div>
    </div>
  );
}
