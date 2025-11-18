// src/components/MainPredictionCard.Skeleton.jsx
import React from 'react';

// This is a helper component to create a pulsing gray bar
function Shimmer({ w, h = 'h-6' }) {
  return (
    <div
      className={`bg-gray-700 dark:bg-gray-300 rounded ${w} ${h} animate-pulse`}
    ></div>
  );
}

export default function MainPredictionCardSkeleton() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-30 relative z-30">
      <div className="rounded-3xl p-6 md:p-8 shadow-xl border border-gray-700 dark:border-gray-300 bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start h-full">
          {/* COLUMN 1 */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-700 dark:bg-gray-300 mr-1 animate-pulse"></span>
              <Shimmer w="w-24" h="h-5" />
            </div>

            <div className="flex items-center gap-4">
              <Shimmer w="w-36" h="h-20" />
            </div>

            <Shimmer w="w-48" h="h-10" />

            <div className="flex justify-between mt-4">
              <div>
                <Shimmer w="w-28" h="h-4" />
                <Shimmer w="w-20" h="h-6" />
              </div>
              <div>
                <Shimmer w="w-16" h="h-4" />
                <Shimmer w="w-24" h="h-6" />
              </div>
            </div>

            {/* AQI Scale Bar Skeleton */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-medium px-1 opacity-0">
                <span>Good</span>
                <span>Hazardous</span>
              </div>
              <div className="flex w-full h-2 rounded-full bg-gray-700 dark:bg-gray-300 animate-pulse mt-1"></div>
              <div className="flex justify-between text-xs font-medium px-1 opacity-0">
                <span>0</span>
                <span>301+</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (Empty) */}
          <div className="min-h-[200px] md:min-h-[300px]"></div>

          {/* COLUMN 3 */}
          <div className="flex flex-col justify-center items-center h-full space-y-4">
            <Shimmer w="w-40" h="h-10" />
            <Shimmer w="w-48" h="h-12" />
            <Shimmer w="w-32" h="h-10" />

            <div className="mt-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-gray-300 animate-pulse"></div>
                <div className="w-24 h-12 rounded-full bg-gray-700 dark:bg-gray-300 animate-pulse"></div>
                <div className="w-24 h-12 rounded-full bg-gray-700 dark:bg-gray-300 animate-pulse"></div>
                <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-gray-300 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}