import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import { useSEO } from '../hooks/useSEO';

const LoginPage = ({ onLogin }) => {
  useSEO({
    title: 'Sign In',
    description: 'Sign in to your Brain Link Tracker account. Access your link tracking dashboard, analytics, and quantum redirect controls.',
    canonical: '/login',
    noIndex: true,
  });
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await onLogin(formData.username, formData.password);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#10b981]/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex justify-center mb-8 cursor-pointer transform transition-transform hover:scale-105" onClick={() => navigate('/')}>
          <Logo size="lg" />
        </div>

        <div className="enterprise-card p-8 rounded-2xl border border-[#1e2d47]/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-xl bg-[#141d2e]/80">
          
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#3b82f6]"></div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to your administration panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">
                Username / Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#3b82f6] transition-colors" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your email"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="enterprise-input w-full pl-10 py-3 h-auto text-sm bg-[rgba(255,255,255,0.02)] border-[#1e2d47] focus:border-[#3b82f6] focus:bg-[rgba(59,130,246,0.03)] focus:ring-1 focus:ring-[#3b82f6]/50 rounded-lg transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Password
                </label>
                <button type="button" className="text-[11px] text-[#3b82f6] hover:underline font-medium">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#3b82f6] transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="enterprise-input w-full pl-10 pr-10 py-3 h-auto text-sm bg-[rgba(255,255,255,0.02)] border-[#1e2d47] focus:border-[#3b82f6] focus:bg-[rgba(59,130,246,0.03)] focus:ring-1 focus:ring-[#3b82f6]/50 rounded-lg transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-3 text-center">
                <p className="text-xs text-[#ef4444] font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#4f8ff7] hover:to-[#1d4ed8] text-white font-semibold py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center disabled:opacity-70 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex justify-center">
            <p className="text-xs text-muted-foreground">
              Don't have an enterprise account? 
              <button onClick={() => navigate('/register')} className="text-[#10b981] font-semibold ml-1 hover:underline">
                Request Access
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
