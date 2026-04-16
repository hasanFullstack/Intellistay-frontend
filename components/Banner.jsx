import React from 'react';

const ScrollingBanner = () => {
  const benefits = [
    "Find hostels that match your budget, location, and travel style.",
    "Explore rooms, amenities, and verified details before booking.",
    "Get personalized hostel recommendations with our personality quiz.",
    "Book smarter with transparent pricing and easy comparisons.",
    "Save your favorite hostels and plan your stay with confidence."
  ];

  // We double the array to ensure the loop is seamless
  const displayItems = [...benefits, ...benefits];

  return (
    <div className="relative w-full overflow-hidden bg-[var(--color-primary)] py-1 text-white">
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