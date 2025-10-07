// frontend/src/pages/LoginPage.tsx
/**
 * Redesain Halaman Login — Industrial Premium, Enterprise-grade UI/UX
 *
 * Aesthetic: industrial blues, charcoal, steel gray dengan accent amber (safety)
 * Layout: asymmetric grid dengan precision, elevated surfaces, premium shadows
 * UX: micro-interactions halus, progressive disclosure, accessibility & performance oriented
 *
 * Branding:
 * - PT Prima Sarana Gemilang — Site Taliabu (industrial corporate identity)
 * - Product: Bebang Pack Meal Portal (assertive hierarchy)
 * - Team credit: IRGA Site Taliabu
 *
 * Technical Notes:
 * - Maintain auth functionality via useAuthStore.login()
 * - Advanced accessibility: labels, aria-live, focus-visible, role attributes
 * - Performance: CSS-only transitions (duration-200/300), GPU-friendly effects
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import {
  UserIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';
import clsx from 'clsx';

function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuthStore();

  // Form state
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation for professional feedback
  const [nikError, setNikError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

  // Progressive disclosure panel (company info / team credits)
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // reset previous messages
    setNikError(undefined);
    setPasswordError(undefined);

    // minimal validation for clear feedback
    let hasError = false;
    if (!nik.trim()) {
      setNikError('NIK wajib diisi.');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Password wajib diisi.');
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await login({ nik, password });
      navigate('/dashboard');
    } catch {
      // Error store menampilkan pesan yang sesuai
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoading;
  const headingId = 'login-title';

  return (
    <div
      className="relative min-h-screen text-white"
      aria-labelledby={headingId}
      role="main"
    >
      {/* Industrial premium background — layered technical grid + gradient */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />

      {/* Technical grid overlay (subtle) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-20 [mask-image:radial-gradient(closest-side,white,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Metallic accent sweep (premium surface depth) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(800px 400px at 15% 20%, rgba(255,255,255,0.06), transparent 50%), radial-gradient(600px 300px at 85% 80%, rgba(255,255,255,0.06), transparent 55%)',
        }}
      />

      {/* Layout grid with asymmetric precision */}
      <div className="relative grid min-h-screen grid-cols-1 md:grid-cols-12 items-center px-6 md:px-12 lg:px-16 py-10 lg:py-0 gap-8">
        {/* Left panel — industrial corporate branding */}
        <section className="md:col-span-5" aria-label="Informasi Perusahaan">
          <div className="mx-auto md:mx-0 max-w-xl md:max-w-none">
            {/* Logo unit — strategic placement */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-lg shadow-black/30 backdrop-blur-sm">
                <BuildingOffice2Icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1
                  id={headingId}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
                >
                  PT Prima Sarana Gemilang
                </h1>
                <p className="mt-0.5 text-base md:text-lg font-semibold text-white/80">
                  Site Taliabu
                </p>
              </div>
            </div>

            {/* Divider accent */}
            <div className="mt-6 h-px w-24 bg-amber-500/70" />

            {/* Product identity */}
            <div className="mt-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                Bebang Pack Meal Portal
              </h2>
              <p className="mt-2 text-sm md:text-base text-white/70 leading-relaxed">
                Portal enterprise untuk pengelolaan alur pack meal end‑to‑end,
                fokus pada kecepatan, keamanan, dan integrasi lintas tim dengan
                visibilitas real‑time. Optimized untuk lingkungan industri.
              </p>
            </div>

            {/* Industrial value props — assertive hierarchy */}
            <ul className="mt-6 space-y-3" aria-label="Keunggulan Sistem">
              <li className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-400 mt-0.5" aria-hidden="true" />
                <p className="text-sm md:text-base text-white/80">
                  Keamanan tingkat enterprise dengan audit trail komprehensif.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Cog6ToothIcon className="h-5 w-5 text-amber-400 mt-0.5" aria-hidden="true" />
                <p className="text-sm md:text-base text-white/80">
                  Alur operasional yang presisi dengan integrasi real‑time.
                </p>
              </li>
            </ul>

            {/* Team credit — professional styling */}
            <div className="mt-8 text-xs text-white/70">
              © Team IRGA Site Taliabu
            </div>
          </div>
        </section>

        {/* Right panel — elevated login surface */}
        <section
          className="md:col-span-7 flex w-full items-center justify-center"
          aria-label="Form Login"
        >
          <div className="w-full max-w-lg">
            <Card
              padding="lg"
              className={clsx(
                'rounded-2xl ring-1 ring-white/10 bg-white/95 backdrop-blur-sm dark:bg-slate-900/90',
                'shadow-2xl shadow-black/30',
                // Advanced border treatments (subtle gradient edge)
                'relative',
              )}
            >
              {/* Premium edge highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 40px rgba(255,255,255,0.05)',
                }}
              />

              {/* Header */}
              <div className="relative text-center">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Masuk ke Akun Anda
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Gunakan NIK dan password yang telah diberikan
                </p>
              </div>

              {/* Error message (store) — aria-live for accessibility */}
              <div
                className="mt-3 min-h-[1.25rem]"
                role="status"
                aria-live="polite"
              >
                {error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-2 space-y-4"
                noValidate
                aria-describedby="login-help"
              >
                <Input
                  label="Nomor Induk Karyawan (NIK)"
                  placeholder="Contoh: EMP001"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  leftIcon={<UserIcon className="h-5 w-5" aria-hidden="true" />}
                  name="nik"
                  autoComplete="username"
                  disabled={disabled}
                  aria-label="NIK"
                  error={nikError}
                  helperText={!nikError ? 'Masukkan NIK sesuai yang terdaftar.' : undefined}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<LockClosedIcon className="h-5 w-5" aria-hidden="true" />}
                  name="password"
                  autoComplete="current-password"
                  disabled={disabled}
                  aria-label="Password"
                  error={passwordError}
                  helperText={!passwordError ? 'Jaga kerahasiaan kredensial Anda.' : undefined}
                />

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    className={clsx(
                      'w-full',
                      // Industrial button styling: steel blue + amber focus
                      'bg-[#1e293b] hover:bg-[#334155] focus:ring-amber-400',
                      'transition-all duration-300',
                    )}
                    isLoading={isSubmitting || isLoading}
                    disabled={disabled}
                  >
                    Masuk
                  </Button>
                </div>

                {/* Secondary actions */}
                <div
                  id="login-help"
                  className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                >
                  <span>Butuh bantuan? Hubungi administrator.</span>
                  <button
                    type="button"
                    className="text-amber-500 hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 rounded"
                    onClick={() => setShowInfo((v) => !v)}
                    aria-expanded={showInfo}
                    aria-controls="company-info"
                  >
                    {showInfo ? 'Tutup info' : 'Info perusahaan'}
                  </button>
                </div>

                {/* Progressive disclosure panel */}
                <div
                  id="company-info"
                  className={clsx(
                    'overflow-hidden transition-all duration-300',
                    showInfo ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0',
                  )}
                  aria-hidden={!showInfo}
                >
                  <div className="mt-3 rounded-lg border border-white/10 bg-white/60 dark:bg-slate-800/60 p-3 text-slate-800 dark:text-slate-200">
                    <h4 className="text-sm font-semibold">Identitas Perusahaan</h4>
                    <p className="mt-1 text-sm">
                      PT Prima Sarana Gemilang — Site Taliabu. Aplikasi ini dirancang
                      untuk kebutuhan operasional industrial dengan fokus keamanan,
                      performa, dan keandalan.
                    </p>
                    <div className="mt-2 h-px bg-amber-500/50" />
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      © Team IRGA Site Taliabu — pengembangan dan pemeliharaan sistem.
                    </p>
                  </div>
                </div>
              </form>

              {/* Security note */}
              <div className="mt-6">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Keamanan data Anda adalah prioritas kami.
                </p>
              </div>

              {/* Sophisticated loading overlay (performance-friendly) */}
              {disabled ? (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-black/10 backdrop-blur-[2px]"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white/90">
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <span className="text-sm">Memuat…</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </section>
      </div>

      {/* Footer credit — strategic placement for professional presentation */}
      <footer className="absolute bottom-4 right-6 text-xs text-white/70 hover:text-white/90 transition-colors">
        © Team IRGA Site Taliabu
      </footer>
    </div>
  );
}

export default LoginPage;