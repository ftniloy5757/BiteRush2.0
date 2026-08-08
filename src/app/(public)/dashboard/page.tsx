"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Utensils } from "lucide-react";
import Chatbot from "@/components/Chatbot";

export default function DashboardGreeting() {
  const { data: session, status } = useSession();
  const [chatbotVisible, setChatbotVisible] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-orange-600 dark:text-orange-400 text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4 text-xl font-semibold">
            You must be logged in to view the dashboard
          </div>
          <Link
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-3 rounded-md font-medium hover:from-orange-600 hover:to-amber-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Extract first name for personalized greeting
  const firstName = session?.user?.firstName || session?.user?.email?.split("@")[0] || "foodie";
  const timeOfDay = getTimeOfDay();

  // Function to toggle the chatbot visibility
  const toggleChatbot = () => {
    setChatbotVisible(!chatbotVisible);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background image with blur effect */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/dashboard.jpg')", // Path to your background image in the public folder
          filter: "blur(10px)", // Apply blur effect
        }}
      ></div>

      {/* Content overlay */}
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Greeting Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-8 text-white">
            <div className="flex items-center mb-6">
              <Utensils className="h-10 w-10 mr-3" />
              <h1 className="text-3xl font-bold">BiteRush</h1>
            </div>

            <div className="text-center py-8">
              <h2 className="text-4xl font-bold mb-3">
                Good {timeOfDay}, {firstName}!
              </h2>
              <p className="text-xl opacity-90">
                Welcome to your food delivery dashboard
              </p>
              <p className="mt-2 text-lg opacity-80">
                What would you like to order today?
              </p>

              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/menu"
                  className="bg-white text-orange-600 hover:bg-orange-100 transition-colors px-6 py-3 rounded-md font-medium text-lg"
                >
                  Browse Menu
                </Link>
                <Link
                  href="/cart"
                  className="bg-orange-700 text-white hover:bg-orange-800 transition-colors px-6 py-3 rounded-md font-medium text-lg"
                >
                  View Cart
                </Link>
                <Link
                  href="/orders"
                  className="bg-red-700 text-white hover:bg-red-800 transition-colors px-6 py-3 rounded-md font-medium text-lg"
                >
                  View Orders
                </Link>
              </div>

              {/* Chatbot Toggle Button with Typing Animation */}
              <div className="mt-16 flex justify-center items-center gap-4">
                <button
                  onClick={toggleChatbot}
                  className="bg-blue-500 text-white px-6 py-3 rounded-md font-medium text-lg hover:bg-blue-600 transition-colors"
                >
                  <span className="typing-animation">
                    {chatbotVisible ? 'Close Chatbot' : 'Can I help you?'}
                  </span>
                </button>
                <img
                  src="/bot.gif" // Path to the bot gif image in the public folder
                  alt="Bot Cartoon"
                  className="w-24 h-24 ml-4" // Increased size of the gif
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Chatbot when chatbotVisible is true */}
      {chatbotVisible && <Chatbot />}
    </div>
  );
}

// Helper function to get time of day for greeting
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
