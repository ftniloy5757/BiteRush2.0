"use client";

import React, { useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "bot"; text: string }>
  >([
    {
      sender: "bot",
      text: "👋 Hi! I'm your BiteRush AI assistant. How can I help you with your order today?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    "What are today's specials?",
    "Track my current order",
    "How does delivery work?",
    "Recommend popular burgers",
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const updatedMessages = [
      ...messages,
      { sender: "user" as const, text: query },
    ];
    setMessages(updatedMessages);
    if (!textToSend) setInput("");

    // Simulate bot response
    setTimeout(() => {
      let botReply =
        "Thanks for reaching out! You can browse our full menu or check your active orders from your dashboard.";
      const lower = query.toLowerCase();

      if (lower.includes("special") || lower.includes("popular") || lower.includes("burger")) {
        botReply =
          "🍔 Our most popular items today are the Spicy Beef Deluxe Burger and Truffle Cheese Fries! Check them out in the Menu tab.";
      } else if (lower.includes("track") || lower.includes("order")) {
        botReply =
          "📦 You can view real-time status for all your orders under 'My Orders' in your profile or navigation menu.";
      } else if (lower.includes("delivery") || lower.includes("fee")) {
        botReply =
          "⚡ We offer Standard (30-40 mins, ৳45) and Priority (20-30 mins, ৳60) delivery!";
      }

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <div>
            <h3 className="font-bold text-sm">BiteRush Assistant</h3>
            <p className="text-xs text-orange-100 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
              Online & Ready
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-orange-600 p-1 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 h-72 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-orange-500 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="text-xs whitespace-nowrap bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1 transition-colors flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-orange-500" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-gray-100"
        />
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
