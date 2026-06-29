import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Image {
  filename: string;
  directory?: string;
  external?: boolean;
  previewUrl?: string;
}

interface IProps {
  images: Image[];
}

export function ImageCarousel({ images }: IProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  const handlePrevious = () => setCurrentIndex((index) => Math.max(0, index - 1));
  const handleNext = () => setCurrentIndex((index) => Math.min(images.length - 1, index + 1));

  if (!images.length) return <div>No images available</div>;

  const imageSource = resolveImageSource(currentImage);

  return (
    <div className="block max-w-md mx-auto text-center relative" style={{ breakInside: "avoid" }}>
      <a
        href={imageSource}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        <img
          src={imageSource}
          alt=""
          className="max-h-[28rem] w-full object-contain bg-[#808080]"
        />
      </a>

      <CarouselControls
        currentIndex={currentIndex}
        total={images.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        filename={currentImage.filename}
      />
    </div>
  );
}

const resolveImageSource = (image: Image) => {
  if (image.previewUrl) {
    return image.previewUrl;
  }

  if (image.external || image.filename.startsWith("http")) {
    return image.filename;
  }

  return image.directory ? `${image.directory}/${image.filename}` : image.filename;
};

const CarouselControls = ({
  currentIndex,
  total,
  onPrevious,
  onNext,
  filename,
}: {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  filename: string;
}) => (
  <>
    <button
      onClick={onPrevious}
      disabled={currentIndex === 0}
      className="group absolute top-1/2 left-2 transform -translate-y-1/2 bg-gray-300 bg-opacity-70 rounded-full p-2 disabled:opacity-50"
      aria-label="Previous Image"
    >
      <ChevronLeft className="w-6 h-6 text-gray-800 group-hover:text-red-500" />
    </button>

    <button
      onClick={onNext}
      disabled={currentIndex === total - 1}
      className="group absolute top-1/2 right-2 transform -translate-y-1/2 bg-gray-300 bg-opacity-70 rounded-full p-2 disabled:opacity-50"
      aria-label="Next Image"
    >
      <ChevronRight className="w-6 h-6 text-gray-800 group-hover:text-red-500" />
    </button>

    <div className="mt-2 font-semibold text-lg">
      {decodeURIComponent(filename?.match(/\/Images\/[^/]+\/([^/.]+)/)?.[1] ?? "")}
    </div>
    <div className="mt-1 text-sm text-gray-600">
      {currentIndex + 1} / {total}
    </div>
  </>
);
