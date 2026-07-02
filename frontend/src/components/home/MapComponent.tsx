import { WithClassName } from "@/types/WithClassName";
import { cn } from "@/lib/utils";

interface Props extends WithClassName {
  src: string;
  title?: string;
}

export const MapComponent = ({ src, title = "Embedded map", className }: Props) => (
  <div className={cn("h-auto w-full flex-1", className)}>
    <iframe
      className="overflow-hidden border-none h-full w-full"
      src={src}
      title={title}
      height="100%"
      width="100%"
    />
  </div>
);
