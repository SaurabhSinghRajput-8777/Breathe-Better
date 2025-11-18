// src/pages/LoginPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="p-8 rounded-2xl border bg-[var(--card)] border-[var(--card-border)] shadow-md">
        <h1 className="text-2xl font-bold text-primary text-center mb-6">
          Login
        </h1>
        
        <form className="space-y-6">
          <div>
            <label className="text-sm font-medium text-secondary block mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="
                w-full p-3 rounded-lg border
                bg-[var(--bg)] text-primary 
                border-[var(--card-border)] 
                focus:border-indigo-500 focus:ring-indigo-500
                transition
              "
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-secondary block mb-2">
              Password
            </label>
            <input
              type="password"
              className="
                w-full p-3 rounded-lg border
                bg-[var(--bg)] text-primary 
                border-[var(--card-border)] 
                focus:border-indigo-500 focus:ring-indigo-500
                transition
              "
              placeholder="Password"
            />
          </div>
          
          <button
            type="submit"
            className="
              w-full py-3 rounded-lg font-semibold
              bg-indigo-600 hover:bg-indigo-700 text-white
              transition
            "
          >
            Login
          </button>
          
          <p className="text-sm text-secondary text-center">
            Don't have an account?{" "}
            <Link to="/Signup" className="font-medium text-indigo-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}