"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Utensils, Mail, Lock, ArrowRight, ShoppingBag, ChefHat, Bike, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const demoAccounts = [
  {
    label: "Customer",
    email: "customer@biterush.com",
    password: "Password123!",
    icon: User,
    color: "from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
    description: "Browse menu, place orders & track delivery",
    emoji: "👤",
  },
  {
    label: "Restaurant",
    email: "restaurant@biterush.com",
    password: "Password123!",
    icon: ChefHat,
    color: "from-emerald-500 to-emerald-600",
    hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
    description: "Manage menu, accept orders & assign riders",
    emoji: "🍳",
  },
  {
    label: "Rider",
    email: "rider@biterush.com",
    password: "Password123!",
    icon: Bike,
    color: "from-violet-500 to-violet-600",
    hoverColor: "hover:from-violet-600 hover:to-violet-700",
    description: "View deliveries, update status & chat",
    emoji: "🛵",
  },
];

export default function SignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  const handleDemoLogin = async (email: string, pwd: string, label: string) => {
    setLoadingDemo(label);
    setError("");

    // First seed demo data
    try {
      await fetch("/api/seed", { method: "POST" });
    } catch {
      // Seed may fail if already seeded, that's ok
    }

    const result = await signIn("credentials", {
      redirect: false,
      identifier: email,
      password: pwd,
    });

    setLoadingDemo(null);

    if (result?.error) {
      setError(`Demo login failed: ${result.error}. Please try seeding data first.`);
    } else {
      // Redirect based on role
      if (email.includes("restaurant")) {
        router.push("/restaurant");
      } else if (email.includes("rider")) {
        router.push("/rider");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Animated food icons background */}
      {[...Array(5)].map((_, i) => (
        <ShoppingBag
          key={i}
          className="text-orange-300 opacity-20 absolute animate-float"
        />
      ))}

      <div className="w-full max-w-md space-y-6">
        {/* Quick Demo Login Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-orange-200 dark:border-gray-800">
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
              ⚡ Quick Demo Access
            </span>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Try BiteRush 2.0 instantly — pick a role below
          </p>
          <div className="grid grid-cols-3 gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                onClick={() => handleDemoLogin(account.email, account.password, account.label)}
                disabled={loadingDemo !== null}
                className={`relative bg-gradient-to-r ${account.color} ${account.hoverColor} text-white rounded-xl p-3 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg`}
              >
                {loadingDemo === account.label ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{account.emoji}</span>
                    <span className="text-xs font-bold">{account.label}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {demoAccounts.map((account) => (
              <p key={account.label} className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                {account.description}
              </p>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-950 dark:to-gray-900 text-gray-500 dark:text-gray-400">
              or sign in with your account
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <Utensils className="text-orange-600 w-12 h-12" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 ml-2">
              BiteRush
            </h2>
          </div>
          <h3 className="text-xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-300">
            Welcome back, food lover!
          </h3>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email or Contact Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="pl-10 block w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="you@example.com or phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-10 block w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
            >
              {isSubmitting ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <div className="mt-4 flex justify-between items-center">
            <Link
              href="/forgot-password"
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              Forgot Password?
            </Link>
          </div>
          <p className="mt-4 text-left text-sm text-gray-600 dark:text-gray-400">
            New to BiteRush?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              Create an account and start ordering
            </Link>
          </p>
          <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              &quot;Join thousands of food lovers enjoying delicious meals
              delivered right to their doorstep.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
