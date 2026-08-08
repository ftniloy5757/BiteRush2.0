"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Utensils, ChevronLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-5 rounded-full">
            <Utensils className="h-16 w-16 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">Oops!</h1>
        <h2 className="text-2xl font-semibold text-orange-600 mb-4">
          Page not found
        </h2>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <Utensils className="h-8 w-8 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          <p className="text-xl font-medium text-gray-700 mb-2">
            Our developer is cooking up this page
          </p>
          <p className="text-gray-600 mb-6">
            Please wait for a while or go back to continue browsing our
            delicious menu!
          </p>

          <button
            onClick={goBack}
            className="inline-flex items-center bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-3 rounded-md font-medium hover:from-orange-600 hover:to-amber-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        <p className="text-gray-500 text-sm">Error 404 | FoodDelivery</p>
      </div>
    </div>
  );
}
