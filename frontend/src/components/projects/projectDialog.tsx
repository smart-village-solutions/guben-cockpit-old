import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Project } from "@shared/public-content/contracts";
import { isNullOrUndefinedOrWhiteSpace } from "@/utilities/nullabilityUtils";
import sanitizeHtml from "sanitize-html";
import { BaseImgTag } from "../ui/BaseImgTag";
import { DialogHeader } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { Image, ImageCarousel } from "../Images/ImageCarousel";

interface IProps {
  project: Project;
  children: React.ReactNode;
  className?: string;
  school?: boolean;
}

export default function ProjectDialog({ project, children, className }: IProps) {
  const imageObjects: Image[] = [];

  return (
    <>
      <style>{`
        .project-text a {
          color: #2563eb;
          text-decoration: underline;
        }
        .project-text a:hover {
          color: #1d4ed8;
        }
      `}</style>

      <Dialog>
        <DialogTrigger className={className}>{children}</DialogTrigger>
        <DialogContent className={cn(
          "bg-white rounded-lg text-lg",
          "flex flex-col gap-4 p-16",
          "min-w-[100svw] max-w-[100svw] min-h-[100svh] max-h-[100svh] md:min-w-[80svw] md:max-w-[80svw] md:min-h-[80svh] md:max-h-[80svh]"
        )}>
          <DialogHeader className="gap-4">
            <DialogTitle className="text-4xl">{project.title}</DialogTitle>

            {imageObjects?.length > 0 ? (
              <div className="max-w-[768px] w-full mx-auto">
                <ImageCarousel
                  images={[
                    ...(project.imageUrl
                      ? [{
                        filename: project.imageUrl,
                        external: true
                      }]
                      : []),
                    ...imageObjects,
                  ]}
                />
              </div>
            ) : project.imageUrl ? (
              <div className="flex flex-col max-w-[512px] rounded-lg overflow-hidden">
                <BaseImgTag
                  className="w-full"
                  alt={project.imageCaption ?? undefined}
                  src={project.imageUrl}
                />
                {project.imageCredits && (
                  <p className="text-sm py-1 px-2 bg-black text-white">
                    © {project.imageCredits}
                  </p>
                )}
              </div>
            ) : null}
          </DialogHeader>

          {!isNullOrUndefinedOrWhiteSpace(project.description) &&
            <div className="text-neutral-800 text-base" dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.description!) }} />
          }

          {!isNullOrUndefinedOrWhiteSpace(project.fullText) &&
            <div className="whitespace-pre-wrap flex flex-col gap-2 text-neutral-800 project-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.fullText!) }} />
          }

        </DialogContent>
      </Dialog>
    </>
  )
}
