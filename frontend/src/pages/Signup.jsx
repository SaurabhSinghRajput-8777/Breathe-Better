// src/pages/Signup.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="min-h-screen flex bg-[--bg] transition-colors">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-600 to-indigo-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-white max-w-md">
           <div className="mb-6 p-3 bg-white/20 w-fit rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
           </div>
           <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Join the Movement.</h1>
           <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
             Create an account to unlock prediction history, save multiple cities, and get personalized health alerts directly to your inbox.
           </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary">Create Account</h2>
            <p className="mt-2 text-sm text-secondary">
              Already a member? <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Log in</Link>
            </p>
          </div>

          <form className="mt-8 space-y-5">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <input 
                    type="text" 
                    required 
                    className="
                      block w-full pl-11 pr-4 py-3.5 rounded-xl 
                      bg-[var(--card)] text-primary border border-[var(--card-border)]
                      placeholder-gray-400 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      outline-none transition-all shadow-sm
                    "
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                  </div>
                  <input 
                    type="email" 
                    required 
                    className="
                      block w-full pl-11 pr-4 py-3.5 rounded-xl 
                      bg-[var(--card)] text-primary border border-[var(--card-border)]
                      placeholder-gray-400 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      outline-none transition-all shadow-sm
                    "
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <input 
                    type="password" 
                    required 
                    className="
                      block w-full pl-11 pr-4 py-3.5 rounded-xl 
                      bg-[var(--card)] text-primary border border-[var(--card-border)]
                      placeholder-gray-400 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      outline-none transition-all shadow-sm
                    "
                    placeholder="Create a password"
                  />
                </div>
              </div>

            <button
              type="submit"
              className="
                w-full flex justify-center py-3.5 px-4 
                border border-transparent rounded-xl shadow-lg 
                text-sm font-bold text-white 
                bg-indigo-600 hover:bg-indigo-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                transition-all active:scale-[0.98]
              "
            >
              Sign Up
            </button>
            
            <p className="text-xs text-center text-secondary">
              By clicking Sign Up, you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}