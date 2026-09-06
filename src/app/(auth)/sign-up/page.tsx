"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signupSchema } from "@/schemas/signupSchema";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
}

export default function Signup() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure the user has accepted terms and conditions
    if (!acceptTerms) {
      toast(
        "You must accept our terms and privacy policy before creating an account."
      );
      return;
    }

    // Validate form data using the Zod schema
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      toast("Please check your information and try again.");
      return;
    }

    try {
      const response = await axios.post("/api/sign-up", formData);
      const res = response.data;
      if (res.success) {
        toast.success("Your account has been created successfully!");
        router.replace(`/verify/${res.userId}`);
      } else {
        toast.error(res.message || "Failed to create account. Please try again.");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while creating your account. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
      {/* Decorative food-related SVG elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-orange-200 dark:text-orange-950 opacity-20">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C5.4 2 2 5.4 2 12c0 7.5 6.5 10 10 10s10-2.5 10-10c0-6.6-3.4-10-10-10zm0 18c-2.2 0-8-1.7-8-8 0-4.9 2.3-8 8-8s8 3.1 8 8c0 6.3-5.8 8-8 8z" />
            <path d="M13 11.9l1.3-2.1c.4-.6 1.3-.8 1.9-.4.6.4.8 1.3.4 1.9l-1.3 2.1c-.4.6-1.3.8-1.9.4s-.8-1.3-.4-1.9z" />
            <path d="M8.4 10.9l-1.3-2.1c-.4-.6-.2-1.5.4-1.9.6-.4 1.5-.2 1.9.4l1.3 2.1c.4.6.2 1.5-.4 1.9-.6.4-1.5.2-1.9-.4z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 text-amber-200 dark:text-amber-950 opacity-20">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4h-5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16h-5V6h5v14z" />
            <path d="M11 4H6C4.9 4 4 4.9 4 6v14c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H6V6h5v14z" />
          </svg>
        </div>
      </div>

      <Card className="w-full max-w-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 mr-3">
              <Utensils className="w-6 h-6" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              BiteRush
            </CardTitle>
          </div>
          <CardTitle className="text-xl font-bold text-orange-600 dark:text-orange-500">
            Fulfill Your Cravings
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-xs">
            Create a new account to start ordering delicious food
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row with firstName and lastName */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className="rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500 text-xs h-10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className="rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500 text-xs h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500 text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className="rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500 text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactNumber" className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="(+880) 1700-000000"
                className="rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500 text-xs h-10"
                required
              />
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-1">
              <Checkbox
                id="acceptedTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) =>
                  setAcceptTerms(checked as boolean)
                }
                className="border-gray-300 dark:border-gray-700 text-orange-600 focus:ring-orange-500"
              />
              <Label htmlFor="acceptedTerms" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                I agree to the terms of service and privacy policy
              </Label>
            </div>
          </form>
        </CardContent>

        {/* Submit button and link to sign in */}
        <CardFooter className="flex flex-col space-y-4 px-6 sm:px-8 pb-8 pt-2">
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 text-xs transition-all"
            onClick={handleSubmit}
          >
            Create Account
          </Button>
          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-orange-600 dark:text-orange-500 hover:underline font-bold"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
