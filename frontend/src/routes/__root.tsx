import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense, lazy } from "react";
import "./index.css";
import { Navbar } from '@/components/Navbar';

const Footer = lazy(() =>
  import("@/components/layout/Footer").then((module) => ({ default: module.Footer })),
);
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((module) => ({ default: module.Toaster })),
);

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className={"min-h-screen h-screen flex flex-col bg-background"}>
      <Navbar />
      <div className={"w-full h-max flex-grow bg-neutral-100 pt-5"}>
        <Outlet/>
      </div>
      <Suspense fallback={<div className="bg-gubenAccent h-14" />}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </div>
  )
}
