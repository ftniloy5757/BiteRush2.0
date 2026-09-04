"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Utensils, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

function SignInForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"CREDENTIALS" | "OTP_CHALLENGE">("CREDENTIALS");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine target redirect URL
  let targetUrl = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/dashboard";
  try {
    if (targetUrl.startsWith("http")) {
      targetUrl = new URL(targetUrl).pathname;
    }
  } catch {}
  if (!targetUrl.startsWith("/") || targetUrl === "/sign-in" || targetUrl === "/sign-up") {
    targetUrl = "/dashboard";
  }

  // Pre-seed demo data in background to ensure database is always ready
  useEffect(() => {
    fetch("/api/seed", { method: "POST" }).catch(() => {});
  }, []);

  // Step 1: Validate credentials and request OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (data.success && data.requires2FA) {
        setStep("OTP_CHALLENGE");
        setMaskedEmail(data.maskedEmail || "");
        if (data.debugOtp) {
          setDebugOtp(data.debugOtp);
        }
        setIsSubmitting(false);
      } else {
        setError(data.message || "Invalid email or password. Please verify your credentials and try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit OTP along with credentials to create session
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: identifier.trim(),
        password: password,
        otp: otp.trim(),
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid verification code. Please check the 6-digit code and try again.");
        } else {
          setError(result.error);
        }
        setIsSubmitting(false);
      } else {
        // Fetch session to determine role-based redirect
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        if (role === "restaurant") {
          router.push("/restaurant");
        } else if (role === "rider") {
          router.push("/rider");
        } else if (role === "admin") {
          router.push(targetUrl === "/dashboard" ? "/admin" : targetUrl);
        } else {
          router.push(targetUrl);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred during sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          {/* Logo & Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-orange-500/20">
              <Utensils className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {step === "CREDENTIALS" ? "Welcome to BiteRush" : "Two-Factor Verification"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {step === "CREDENTIALS"
                ? "Sign in to order delicious food and track your deliveries"
                : `Enter the 6-digit code sent to ${maskedEmail}`}
            </p>
          </div>

          {/* Security Badge (visible during 2FA step) */}
          {step === "OTP_CHALLENGE" && (
            <div className="mb-5 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              <span>HMAC-SHA256 Two-Factor Authentication</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-5 rounded-2xl text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug OTP hint for demo/testing */}
          {step === "OTP_CHALLENGE" && debugOtp && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-4 py-2.5 rounded-2xl text-xs border border-amber-200 dark:border-amber-800">
              <span className="font-bold">Demo Mode:</span> Your 2FA code is{" "}
              <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">{debugOtp}</code>
            </div>
          )}

          {/* Step 1: Credentials Form */}
          {step === "CREDENTIALS" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Email or Contact Number
                </label>
                <div className="relative rounded-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    className="pl-10 pr-4 py-2.5 h-11 text-xs rounded-2xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/50 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="name@example.com or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-orange-600 hover:text-orange-500 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative rounded-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10 pr-10 py-2.5 h-11 text-xs rounded-2xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/50 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !identifier || !password}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === "OTP_CHALLENGE" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  6-Digit Verification Code
                </label>
                <div className="relative rounded-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="pl-10 pr-4 py-2.5 h-11 text-sm font-mono tracking-[0.5em] rounded-2xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/50 focus:border-orange-500 focus:ring-orange-500 text-center"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-500/20 text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying 2FA Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("CREDENTIALS");
                  setOtp("");
                  setError("");
                  setDebugOtp("");
                }}
                className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold mt-1"
              >
                ← Back to credentials
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-bold text-orange-600 hover:text-orange-500 transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
