import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, type Swiper as SwiperType } from 'swiper/modules';
import { ReviewCard } from './ReviewCard';
import { reviews } from '../data/reviews';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ReviewsSection() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  
  // Update navigation when swiper instance is available
  useEffect(() => {
    if (swiper) {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [swiper]);

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Lo que dicen nuestros usuarios
        </h2>
        
        <div className="relative">
          {/* Left fade effect */}
          <div className="absolute left-0 top-0 w-24 h-full z-10 pointer-events-none bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900"></div>
          
          {/* Right fade effect */}
          <div className="absolute right-0 top-0 w-24 h-full z-10 pointer-events-none bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900"></div>
          
          {/* Left navigation button */}
          <button
            ref={prevRef}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 text-brand-primary rounded-full p-2 shadow-lg hover:bg-brand-primary hover:text-white transition-colors focus:outline-none"
            aria-label="Previous slide"
            onClick={() => swiper?.slidePrev()}
          >
            <ChevronLeft size={24} />
          </button>
          
          {/* Right navigation button */}
          <button
            ref={nextRef}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 text-brand-primary rounded-full p-2 shadow-lg hover:bg-brand-primary hover:text-white transition-colors focus:outline-none"
            aria-label="Next slide"
            onClick={() => swiper?.slideNext()}
          >
            <ChevronRight size={24} />
          </button>
          
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            onSwiper={setSwiper}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
              enabled: true,
            }}
            pagination={{
              clickable: true,
              el: '.swiper-pagination',
              bulletClass: 'inline-block w-3 h-3 mx-1 bg-brand-primary rounded-full opacity-70',
              bulletActiveClass: 'opacity-100',
            }}
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="py-8 px-12"
          >
            {reviews.map((review) => (
              <SwiperSlide key={review.id} className="px-2">
                <ReviewCard {...review} />
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Pagination dots container */}
          <div className="swiper-pagination flex justify-center mt-8"></div>
        </div>
      </div>
    </section>
  );
}