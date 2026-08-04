import { Link } from "@tanstack/react-router";
import type { Poi } from "@shared/public-content/contracts";

import { GenericCard } from "@/components/ui/GenericCard";

export const PoiCard = ({ poi }: { poi: Poi }) => (
  <Link to="/projects/$projectId" params={{ projectId: poi.id }} className="h-full">
    <GenericCard
      imageUrl={poi.imageUrl ?? undefined}
      imageAlt={poi.title}
      title={poi.title}
      titleSize="text-lg"
    />
  </Link>
);
