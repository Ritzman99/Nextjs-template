'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './signin.module.scss';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = (searchParams.get('callbackUrl') as string) || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setFormError('Invalid email or password.');
        setLoading(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setFormError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  function handleGoogleSignIn() {
    signIn('google', { callbackUrl });
  }

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.card} fade-in`}>
        <h1 className={styles.title}>Sign in</h1>
        {(error === 'CredentialsSignin' || formError) && (
          <p className={styles.error} role="alert">
            {formError ?? 'Invalid email or password.'}
          </p>
        )}
        <form onSubmit={handleCredentialsSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className={styles.divider}>
          <span>or</span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.google}
        >
          Sign in with Google
        </Button>
        <p className={styles.footer}>
          Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className={styles.wrapper}><div className={styles.card}><p className={styles.loading}>Loading...</p></div></div>}>
      <SignInForm />
    </Suspense>
  );
}
