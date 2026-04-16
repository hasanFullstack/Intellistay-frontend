import React from 'react';

const ScrollingBanner = () => {
  const benefits = [
    "Gives agents a competitive edge with smarter search tools.",
    "Helps investors analyze deals with comps and ROI data.",
    "Reduces wasted showings that don't match buyer needs.",
    "Makes home buying fun and lifestyle-focused.",
    "Buyers search for *features*, not just filters."
  ];

  // We double the array to ensure the loop is seamless
  const displayItems = [...benefits, ...benefits];

  return (
    <div className="relative w-full overflow-hidden bg-[var(--color-primary)] py-2.5 text-white">
      {/* Injecting the keyframe animation directly into the component */}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <ul className="animate-marquee list-none m-0 p-0 flex items-center">
        {displayItems.map((item, index) => (
          <li 
            key={index} 
            className="flex items-center px-10 whitespace-nowrap text-lg font-medium"
          >
            <span className="mr-4 text-2xl">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScrollingBanner;