import { Navigate, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/projects/marketplace")({
  component: () => <Navigate to="/projects" search={{ categoryIds: ["6187"], sort: "name", direction: "asc", page: 1, pageSize: 12 }} replace />,
});
