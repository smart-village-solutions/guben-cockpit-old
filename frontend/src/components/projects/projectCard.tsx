import type { Project } from "@shared/public-content/contracts";
import { ExternalLinkIcon } from "lucide-react";
import ProjectDialog from "@/components/projects/projectDialog";

interface IProps {
  project: Project;
  school?: boolean;
}

export default function ProjectCard({ project, school }: IProps) {
  return (
    <ProjectDialog project={project} school={school}>
      <div className={"flex flex-col h-40 rounded-md overflow-hidden bg-neutral-800 text-white group"}>
        {project.imageUrl && (
          <div className={"h-3/4"}>
            <img
              className={"object-cover object-center h-full w-full"}
              src={project.imageUrl}
              alt={"image"}
            />
          </div>
        )}
        <div className={"h-1/4 mt-auto flex justify-between px-2 py-0 items-center text-sm"}>
          <p>{project.title}</p>
          <ExternalLinkIcon className="group-hover:visible invisible size-4" />
        </div>
      </div>
    </ProjectDialog>
  )
}
