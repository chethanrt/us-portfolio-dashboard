import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingSkeleton } from "@/components/common";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Application shell used by every page:
 * fixed top navbar (70px), fixed sidebar (260px, collapses to a drawer
 * below lg), scrollable content area with footer.
 */
export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onMenuClick={() => setMobileNavOpen(true)} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 top-[70px] z-30 hidden w-[260px] border-r lg:block">
        <Sidebar />
      </aside>

      {/* Mobile / tablet sidebar drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} className="pt-8" />
        </SheetContent>
      </Sheet>

      {/* Content area */}
      <main className="pt-[70px] lg:pl-[260px]">
        <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-7xl flex-col px-4 py-6 lg:px-8">
          <div className="flex-1">
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Outlet />
            </Suspense>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
