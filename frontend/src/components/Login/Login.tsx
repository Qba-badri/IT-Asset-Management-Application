import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  Eye, EyeOff, Loader2, Shield, BarChart3,
  Monitor, KeyRound, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FormField } from '../shared/FormField';
import { useForm } from '../../hooks/useForm';

interface LoginFormData {
  email: string;
  password: string;
}

const features = [
  {
    icon: Monitor,
    title: 'Asset Tracking',
    desc: 'Track every device from procurement to disposal with full lifecycle visibility.',
  },
  {
    icon: KeyRound,
    title: 'License Management',
    desc: 'Monitor software licenses, assignments, and renewal dates in one place.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Real-time dashboards with depreciation insights and utilisation trends.',
  },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validateForm
  } = useForm({
    email: '',
    password: '',
  }, {
    email: { required: true, email: true },
    password: { required: true }
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ───── Left branding panel (hidden on mobile) ───── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-white/20" />
          <div className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-white/15" />
          <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] rounded-full bg-white/10" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] bg-[size:40px_40px]"
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top – Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="IT Asset Management" className="h-12 object-contain brightness-0 invert" />
          </div>

          {/* Middle – Hero copy */}
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
                Manage your IT assets
                <br />
                <span className="text-blue-200">with confidence.</span>
              </h1>
              <p className="text-blue-100 text-base leading-relaxed">
                A unified platform to track hardware, manage licenses, schedule maintenance,
                and generate compliance reports — all from one dashboard.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-4 transition-all hover:bg-white/[0.15]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-blue-200 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ───── Right login panel ───── */}
      <div className="flex w-full lg:w-[45%] items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6 sm:p-12 relative overflow-y-auto">
        {/* Subtle top-right accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <div className="relative z-10 w-full max-w-sm space-y-8">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/logo.svg" alt="IT Asset Management" className="h-10 object-contain" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <svg className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            <FormField
              id="email"
              label="Email address"
              required
              error={errors.email}
            >
              <Input
                type="email"
                id="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={loading}
                autoComplete="off"
                className="h-11 bg-white shadow-sm"
              />
            </FormField>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors no-underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <FormField
                id="password"
                label="Password"
                hideLabel
                required
                error={errors.password}
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    autoComplete="off"
                    className="h-11 pr-10 bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t">
            <p className="text-center text-xs text-muted-foreground">
              Protected by industry-standard encryption.
              <br />
              <span className="text-muted-foreground/60">
                &copy; {new Date().getFullYear()} IT Asset Management. All rights reserved.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Login;
