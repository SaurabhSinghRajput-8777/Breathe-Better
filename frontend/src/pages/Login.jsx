// src/pages/Login.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen flex bg-[--bg] transition-colors">
      
      {/* LEFT PANEL: Visual Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-600 to-indigo-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-white max-w-md">
           <div className="mb-6 p-3 bg-white/20 w-fit rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
           </div>
           <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Welcome Back!</h1>
           <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
             Log in to access your personalized air quality dashboard, manage alerts, and download comprehensive reports.
           </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        
        {/* Mobile-only background blob */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary">Sign In</h2>
            <p className="mt-2 text-sm text-secondary">
              New to BreatheBetter? <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Create an account</Link>
            </p>
          </div>

          <form className="mt-8 space-y-6">
            <div className="space-y-5">
              
              {/* Email Input */}
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

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                </div>
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
                    placeholder="••••••••"
                  />
                </div>
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
              Sign In
            </button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--card-border)]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3 bg-[var(--bg)] text-secondary font-bold tracking-wider">Or continue with</span>
              </div>
            </div>
            
            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
               <SocialButton icon="google" label="Google" />
               <SocialButton icon="github" label="GitHub" />
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ icon, label }) {
  return (
    <button type="button" className="
      w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 
      border border-[var(--card-border)] rounded-xl shadow-sm 
      bg-[var(--card)] text-sm font-semibold text-primary 
      hover:bg-gray-50 dark:hover:bg-white/5 
      transition-all active:scale-95
    ">
      {icon === 'google' && (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
      )}
      {icon === 'github' && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
      )}
      {label}
    </button>
  );
}