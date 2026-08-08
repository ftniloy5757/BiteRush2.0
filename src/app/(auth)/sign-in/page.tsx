"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Utensils, Mail, Lock, ArrowRight, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      {/* Animated food icons background */}
      {[...Array(5)].map((_, i) => (
        <ShoppingBag
          key={i}
          className="text-orange-300 opacity-20 absolute animate-float"
        />
      ))}

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Utensils className="text-orange-600 w-12 h-12" />
          <h2 className="text-3xl font-bold text-gray-800 ml-2">
            BiteRush
          </h2>
        </div>
        <h3 className="text-xl font-semibold text-center mb-6 text-gray-700">
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
              className="block text-sm font-medium text-gray-700"
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
              className="block text-sm font-medium text-gray-700"
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
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
          >
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
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
        <p className="mt-4 text-left text-sm text-gray-600">
          New to BiteRush?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-orange-600 hover:text-orange-500"
          >
            Create an account and start ordering
          </Link>
        </p>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-center text-gray-500">
            &quot;Join thousands of food lovers enjoying delicious meals
            delivered right to their doorstep.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
