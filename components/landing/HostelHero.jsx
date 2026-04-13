import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Typewriter } from "react-simple-typewriter";

const baseImages = [
  "https://www.newportworldresorts.com/sites/default/files/inline-images/image2_9.png",
  "https://images.pexels.com/photos/5147364/pexels-photo-5147364.jpeg",
  "/5.jpg",
  "/7.jpg",
];

// Duplicate enough times so Swiper always has slides to loop over
const images = [...baseImages, ...baseImages, ...baseImages, ...baseImages];

const HeroSlider = () => {
  const curveOverlayBase = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: "68%",
    height: "170px",
    background: "#fff",
    borderRadius: "30%",
    zIndex: 3,
    pointerEvents: "none",
  };

  return (
    <div className="pt-20">
      <div className="flex flex-col items-center text-center gap-4 mb-8 px-4">
        <h1 className="!text-3xl md:!text-6xl font-bold">
          Find hostels by{" "}
          <span className="text-[#235784]">
            <Typewriter
              words={[
                "Location you prefer.",
                "Amenities you want.",
                "Features you love.",
              ]}
              loop={true}
              cursor
              cursorStyle="|"
              typeSpeed={70}
              deleteSpeed={40}
              delaySpeed={1500}
            />
          </span>
        </h1>
        <h6 className="!text-2`xl text-black leading-[100%] max-sm:text-center">
          Your AI-powered way to find hostels with the features that matter.
        </h6>
      </div>
      <div className="w-full overflow-hidden bg-white relative">
        {/* Curve mask (center trimmed, sides taller) */}
        <div style={{ ...curveOverlayBase, top: -105, width: "120%" }} />
        <div style={{ ...curveOverlayBase, bottom: -105, width: "120%" }} />

        <Swiper
          modules={[Autoplay]}
          slidesPerView={5}
          breakpoints={{
            0: {
              slidesPerView: 1,
            },
            576: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            992: {
              slidesPerView: 4,
            },
            1200: {
              slidesPerView: 5,
            },
          }}
          spaceBetween={20}
          loop={true}
          loopFillGroupWithBlank={false}
          // autoplay is fully continuous below
          style={{
            width: "100%",
            padding: "0",
            height: "440px",
          }}
          speed={1500}
          loopAdditionalSlides={baseImages.length}
          autoplay={{
            delay: 400,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            waitForTransition: true,
          }}
          allowTouchMove={true}
        >
          {images.map((img, index) => (
            <SwiperSlide key={index}>
              <div
                style={{
                  height: "370px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={img}
                  alt={`slide-${index}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default HeroSlider;
