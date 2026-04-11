import type { Project } from "@shared/public-content/contracts";
import { Link } from "@tanstack/react-router";
import { GenericCard } from "@/components/ui/GenericCard";

interface IProps {
  project: Project;
  school?: boolean;
}

export default function ProjectCard({ project, school }: IProps) {
  return (
    <Link to={`/projects/${project.id}`} className="h-full">
      <GenericCard
        imageUrl={project.imageUrl ?? undefined}
        imageAlt={project.title}
        title={project.title}
        titleSize="text-lg"
        description={undefined}
      />
    </Link>
  )
}
