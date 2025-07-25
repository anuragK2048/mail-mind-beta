import EmailListDisplay from "@/components/common/EmailListDisplay";
import AiSectionLayout from "@/features/ai/AiSectionLayout";
import EmailDisplayWrapper from "@/features/email/EmailDisplay";
import EmailListLayout from "@/features/Inbox/EmailListLayout";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

function EmailScreen({ children }) {
  const { emailId } = useParams();
  const [staleEmailId, setStaleEmailId] = useState(null);
  const [showAiSection, setShowAiSection] = useState(false);
  const [staleShowAiSection, setStaleShowAiSection] = useState(false);

  useEffect(() => {
    if (emailId) {
      console.log("hi");
      // When a new email is selected, update the state immediately
      setStaleEmailId(emailId);
    } else {
      // When navigating back, wait for the animation before removing the component
      const timer = setTimeout(() => {
        setStaleEmailId(null);
        setShowAiSection(false);
      }, 1000);

      // ✨ 3. Cleanup function is crucial to prevent bugs if the user navigates quickly
      return () => clearTimeout(timer);
    }
  }, [emailId]);
  useEffect(() => {
    if (showAiSection) {
      // When a new email is selected, update the state immediately
      setStaleShowAiSection(true);
    } else {
      // When navigating back, wait for the animation before removing the component
      const timer = setTimeout(() => {
        setStaleShowAiSection(false);
      }, 1000);

      // ✨ 3. Cleanup function is crucial to prevent bugs if the user navigates quickly
      return () => clearTimeout(timer);
    }
  }, [showAiSection]);

  return (
    <div className="relative flex h-full w-full">
      {/* <div
        className="absolute -right-10 bg-accent"
        onClick={() => setShowAiSection((cur) => !cur)}
      >
        Show ai
      </div> */}
      <div
        className={`flex h-full flex-shrink-0 transition-all duration-1000 ease-in-out ${emailId && showAiSection ? "w-0 opacity-20" : emailId ? "w-0 lg:w-4/12" : "w-full"} `}
      >
        {children}
      </div>
      <div
        className={`transition-all duration-1000 ease-in-out ${emailId && !showAiSection ? "w-full" : `w-0 ${emailId ? "" : "opacity-20"}`} min-w-0 rounded-sm bg-accent/0 lg:w-8/12 lg:px-4`}
      >
        {staleEmailId && <EmailDisplayWrapper emailId={staleEmailId} />}
      </div>
      <div
        className={`transition-all duration-1000 ease-in-out ${showAiSection ? "w-full lg:w-4/12" : "w-0 opacity-20"} min-w-0`}
      >
        {staleShowAiSection && (
          <AiSectionLayout showSection={staleShowAiSection} />
        )}
      </div>
      {/* )} */}
    </div>
  );
}

export default EmailScreen;
