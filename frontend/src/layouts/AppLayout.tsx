import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import OptionsHeader from "@/components/common/OptionsHeader";
import { Outlet } from "react-router";
import { useEffect } from "react";
import { startWatchingForUpdates } from "@/api/syncApi";

export default function AppLayout() {
  // Start watching for incoming emails
  useEffect(() => {
    startWatchingForUpdates();
  }, []);
  return (
    <SidebarProvider className="flex h-full w-full">
      <AppSidebar />
      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <SidebarTrigger className="absolute top-5.5 left-2 z-50 md:top-0 md:left-0" />
        <div className="relative mt-2 ml-8 flex shrink-0 items-center justify-center px-4 md:ml-0 md:px-12 lg:px-20">
          <OptionsHeader />
        </div>
        <div className="relative z-0 w-full flex-1 overflow-hidden px-4 pb-4 md:px-12 lg:px-20">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

// Mark as Read/Unread
// Done
// Star
// Remind later
