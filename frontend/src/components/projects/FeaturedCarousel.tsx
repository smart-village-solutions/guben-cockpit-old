import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useTranslation } from "react-i18next";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CarouselSlide {
  id: string;
  image: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  link: string;
}

interface FeaturedCarouselProps {
  slides: CarouselSlide[];
}

export const FeaturedCarousel = ({ slides }: FeaturedCarouselProps) => {
  const { t } = useTranslation("common");

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 mb-8 max-w-7xl mx-auto px-4 w-full featured-carousel">
      <style>{`
        .featured-carousel .swiper-button-next,
        .featured-carousel .swiper-button-prev {
          color: #cd1421;
        }
        .featured-carousel .swiper-pagination-bullet-active {
          background-color: #cd1421;
        }
      `}</style>
      <div className="rounded-lg overflow-hidden bg-green-600 shadow-lg">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          simulateTouch={false}
          noSwiping={true}
          preventInteractionOnTransition={true}
          className="w-full h-144"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-full flex flex-col">
                {/* Image Section */}
                <div className="flex h-96 items-center justify-center overflow-hidden bg-[#808080]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 text-white">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                        style={{ backgroundColor: `#${slide.iconColor}` }}
                      >
                        <img
                          src={slide.icon}
                          alt={slide.title}
                          className="w-8 h-8 object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={slide.link}
                        className="hover:underline pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="font-bold text-sm line-clamp-2">
                          {slide.title}
                        </h3>
                      </a>
                      <a
                        href={slide.link}
                        className="mt-1 inline-block text-xs font-semibold text-white hover:underline pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("ReadMore")} &gt;
                      </a>
                      <p className="mt-2 text-xs line-clamp-2">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
