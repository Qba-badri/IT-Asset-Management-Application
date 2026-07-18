import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, KeyRound, Loader2, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { FormField } from '../shared/FormField';
import { useForm } from '../../hooks/useForm';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm({ email: '' }, {
    email: { label: 'Email address', required: true, email: true },
  });

  const otpForm = useForm({ otp: '' }, {
    otp: { label: 'One-time password', required: true, minLength: 6 },
  });

  const resetForm = useForm({ newPassword: '', confirmPassword: '' }, {
    newPassword: { label: 'New password', required: true, minLength: 8 },
    confirmPassword: {
      label: 'Confirm password',
      required: true,
      custom: (value, allValues) =>
        value !== allValues.newPassword ? 'Passwords do not match.' : null,
    },
  });

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!emailForm.validateForm()) return;
    setLoading(true);
    try {
      await authService.requestPasswordReset(emailForm.values.email);
      setSuccess('OTP sent to your email address');
      setStep('otp');
    } catch (err: any) { setError(err.message || 'Failed to send reset code.'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!otpForm.validateForm()) return;
    setLoading(true);
    try {
      await authService.verifyOtp(emailForm.values.email, otpForm.values.otp);
      setSuccess('OTP verified successfully');
      setStep('reset');
    } catch (err: any) { setError(err.message || 'Invalid OTP.'); }
    finally { setLoading(false); }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!resetForm.validateForm()) return;
    setLoading(true);
    try {
      await authService.resetPassword(emailForm.values.email, otpForm.values.otp, resetForm.values.newPassword);
      setSuccess('Password reset successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) { setError(err.message || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  const stepIcons = { email: Mail, otp: ShieldCheck, reset: KeyRound };
  const stepTitles = { email: 'Reset Password', otp: 'Verify OTP', reset: 'New Password' };
  const stepDescriptions = {
    email: 'Enter your email to receive a reset code',
    otp: `Enter the OTP sent to ${emailForm.values.email}`,
    reset: 'Choose a new password for your account',
  };
  const StepIcon = stepIcons[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-2">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-2">
            {(['email', 'otp', 'reset'] as const).map((s, i) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= ['email', 'otp', 'reset'].indexOf(step) ? 'bg-primary' : 'bg-muted'
              }`} />
            ))}
          </div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <StepIcon className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{stepTitles[step]}</CardTitle>
            <CardDescription className="mt-1">{stepDescriptions[step]}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
              <FormField id="email" label="Email Address" required error={emailForm.errors.email}>
                <Input type="email" placeholder="name@company.com" value={emailForm.values.email}
                  onChange={(e) => { emailForm.handleChange('email', e.target.value); setError(''); }}
                  onBlur={() => emailForm.handleBlur('email')}
                  disabled={loading} className="h-11" />
              </FormField>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Code'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">
              <FormField id="otp" label="One-Time Password" required error={otpForm.errors.otp}>
                <Input type="text" placeholder="Enter 6-digit OTP" value={otpForm.values.otp}
                  onChange={(e) => { otpForm.handleChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  onBlur={() => otpForm.handleBlur('otp')}
                  disabled={loading} maxLength={6} className="h-11 text-center text-lg tracking-widest" />
              </FormField>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify OTP'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('email'); setError(''); setSuccess(''); }} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />Back
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
              <FormField id="newPassword" label="New Password" required error={resetForm.errors.newPassword} hint="At least 8 characters">
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Enter new password" value={resetForm.values.newPassword}
                    onChange={(e) => { resetForm.handleChange('newPassword', e.target.value); setError(''); }}
                    onBlur={() => resetForm.handleBlur('newPassword')}
                    disabled={loading} className="h-11 pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <FormField id="confirmPassword" label="Confirm Password" required error={resetForm.errors.confirmPassword}>
                <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={resetForm.values.confirmPassword}
                    onChange={(e) => { resetForm.handleChange('confirmPassword', e.target.value); setError(''); }}
                    onBlur={() => resetForm.handleBlur('confirmPassword')}
                    disabled={loading} className="h-11 pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</> : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <Link to="/login" className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
