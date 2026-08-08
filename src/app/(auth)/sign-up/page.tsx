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
        toast("Your account has been created successfully.");
        router.replace(`/verify/${res.userId}`);
      }
    } catch (error) {
      toast("An error occurred while creating your account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      {/* Decorative food-related SVG elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-orange-200 opacity-20">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C5.4 2 2 5.4 2 12c0 7.5 6.5 10 10 10s10-2.5 10-10c0-6.6-3.4-10-10-10zm0 18c-2.2 0-8-1.7-8-8 0-4.9 2.3-8 8-8s8 3.1 8 8c0 6.3-5.8 8-8 8z" />
            <path d="M13 11.9l1.3-2.1c.4-.6 1.3-.8 1.9-.4.6.4.8 1.3.4 1.9l-1.3 2.1c-.4.6-1.3.8-1.9.4s-.8-1.3-.4-1.9z" />
            <path d="M8.4 10.9l-1.3-2.1c-.4-.6-.2-1.5.4-1.9.6-.4 1.5-.2 1.9.4l1.3 2.1c.4.6.2 1.5-.4 1.9-.6.4-1.5.2-1.9-.4z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 text-amber-200 opacity-20">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4h-5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16h-5V6h5v14z" />
            <path d="M11 4H6C4.9 4 4 4.9 4 6v14c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H6V6h5v14z" />
          </svg>
        </div>
      </div>

      <Card className="w-full max-w-2xl shadow-xl bg-white relative">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Utensils className="text-orange-600 w-8 h-8 mr-2" />
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              BiteRush
            </CardTitle>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-orange-600">
            Fulfill Your Cravings
          </CardTitle>
          <CardDescription className="text-center">
            Create a new account to start ordering delicious food
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row with firstName and lastName */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-gray-700">
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="(+880) 1700-000000"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="acceptedTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) =>
                  setAcceptTerms(checked as boolean)
                }
                className="text-orange-600 border-gray-300 focus:ring-orange-500"
              />
              <Label htmlFor="acceptedTerms" className="text-sm text-gray-600">
                I agree to the terms of service and privacy policy
              </Label>
            </div>
          </form>
        </CardContent>

        {/* Submit button and link to sign in */}
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
            onClick={handleSubmit}
          >
            Create Account
          </Button>
          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-orange-600 hover:text-orange-500 hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
