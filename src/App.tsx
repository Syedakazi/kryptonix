import { AppLayout } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { AnswerPage } from "@/pages/AnswerPage";
import { SignInPage } from "@/pages/SignInPage";
import { StudentDashboardPage } from "@/pages/StudentDashboardPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  ),
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: SignInPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <AppLayout>
      <StudentDashboardPage />
    </AppLayout>
  ),
});

const answerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assignment/$assignmentId",
  component: () => (
    <AppLayout>
      <AnswerPage />
    </AppLayout>
  ),
});

const routeTree = rootRoute.addChildren([
  signInRoute,
  dashboardRoute,
  answerRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
