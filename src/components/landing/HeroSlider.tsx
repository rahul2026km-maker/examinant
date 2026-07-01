import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import desktopslider3 from '../../assets/desktopslider3.png';
import desktopslider4 from '../../assets/desktopslider4.png';
import desktopslider5 from '../../assets/desktopslider5.png';
import slider3 from '../../assets/slider3.png';
import slider4 from '../../assets/slioder4.png';
import slider5 from '../../assets/slider5.png';
import slider7 from '../../assets/slider7.png';
import slider8 from '../../assets/slider8.png';
import slider9 from '../../assets/slider9.png';
import slider10 from '../../assets/slider10.png';
import slider11 from '../../assets/slider11.png';

const BANNERS = [
  { mobile: slider11, desktop: slider11 },
  { mobile: slider10, desktop: slider10 },
  { mobile: slider9, desktop: slider9 },
  { mobile: slider8, desktop: slider8 },
  { mobile: slider7, desktop: slider7 },
  { mobile: slider3, desktop: desktopslider3 },
  { mobile: slider4, desktop: desktopslider4 },
  { mobile: slider5, desktop: desktopslider5 }
];

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Preload all banner images in the background to ensure instant transitions
    BANNERS.forEach((banner) => {
      const imgMobile = new Image();
      imgMobile.src = banner.mobile;
      const imgDesktop = new Image();
      imgDesktop.src = banner.desktop;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

  return (
    <section className="relative w-full mt-[72px] overflow-hidden bg-[#081028] group">
      {/* Invisible placeholder dictates the slider height naturally based on the image's aspect ratio on mobile */}
      <img src={BANNERS[0].mobile} alt="placeholder" className="w-full h-auto invisible pointer-events-none md:hidden" />
      {/* Invisible placeholder dictates the slider height naturally based on the image's aspect ratio on desktop */}
      <img src={BANNERS[0].desktop} alt="placeholder" className="hidden md:block w-full h-auto invisible pointer-events-none" />

      <div className="absolute inset-0">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Mobile Image */}
            <img
              src={BANNERS[currentIndex].mobile}
              alt={`Slide ${currentIndex + 1} Mobile`}
              className="w-full h-full object-fill object-center md:hidden"
            />
            {/* Desktop Image */}
            <img
              src={BANNERS[currentIndex].desktop}
              alt={`Slide ${currentIndex + 1} Desktop`}
              className="hidden md:block w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all shadow-lg"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all shadow-lg"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 shadow-md ${idx === currentIndex ? 'bg-blue-600 w-8' : 'bg-white/70 hover:bg-white w-2.5'
              }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
