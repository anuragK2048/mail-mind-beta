import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "@/features/Landing/LandingPage";
import AppLayout from "@/layouts/AppLayout";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmailScreen from "@/components/common/EmailScreen";
import InboxRedirect from "@/features/Inbox/InboxRedirect";
import SchedulerComingSoon from "@/components/common/ComingSoonScreen";
import EmailListDisplay from "@/components/common/EmailListDisplay";
import EmailListLayout from "@/features/Inbox/EmailListLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/test"
              element={
                <div className="flex items-center justify-center text-slate-300">
                  Hey, can you see me?????
                </div>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/inbox" element={<InboxRedirect />} />
              <Route
                path="/inbox/:labelId/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListLayout />
                  </EmailScreen>
                }
              >
                {/* <Route path=":emailId" element={<EmailDisplayWrapper />} /> */}
              </Route>
              <Route
                path="starred/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListDisplay />
                  </EmailScreen>
                }
              />
              <Route
                path="drafts/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListDisplay />
                  </EmailScreen>
                }
              />
              <Route
                path="sent/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListDisplay />
                  </EmailScreen>
                }
              />
              <Route
                path="done/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListDisplay />
                  </EmailScreen>
                }
              />
              <Route
                path="spam/:emailId?"
                element={
                  <EmailScreen>
                    <EmailListDisplay />
                  </EmailScreen>
                }
              />
              <Route path="/scheduled" element={<SchedulerComingSoon />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
