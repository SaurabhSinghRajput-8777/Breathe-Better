import React from "react";

export default function Footer() {
  return (
    <footer
      className="
        w-full mt-20 z-50
        border-t border-gray-300 dark:border-gray-700
        backdrop-blur-md bg-(--bg)/80
        transition-all
      "
    >
      <div className="h-16 flex items-center justify-center text-secondary text-sm">
        © 2025 BreatheBetter. All Rights Reserved.
      </div>
    </footer>
  );
}
