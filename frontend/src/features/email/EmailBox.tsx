import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Star,
  Trash,
  Archive,
  ArrowLeft,
  Check,
  Clock,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
// import DOMPurify from "dompurify"; // Import for security

// Helper to format dates, kept from your original code
const formatDate = (dateString, format = "full") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (format === "full") {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } else if (format === "date") {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else if (format === "time") {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  }
};

// The component now receives the full email object from your DB
function EmailBox({
  emailDetails,
  onStar,
  onArchive,
  onTrash,
}: {
  emailDetails: any;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [iframeHeight, setIframeHeight] = useState(400);
  const iframeRef = useRef(null);
  const [expanded, setExpanded] = useState(true);

  const updateIframeContent = (content) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sanitizedContent = content;

    // Create blob URL for iframe content
    const blob = new Blob([sanitizedContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    iframe.src = url;

    // Clean up blob URL after iframe loads
    iframe.onload = () => {
      URL.revokeObjectURL(url);

      // Auto-resize iframe based on content
      try {
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;
        // Use body scrollHeight instead of documentElement, and add small delay for accurate measurement
        setTimeout(() => {
          const bodyHeight = iframeDocument.body.scrollHeight;
          const documentHeight = iframeDocument.documentElement.scrollHeight;
          // Use the smaller of the two heights to avoid double sizing
          const actualHeight = Math.min(bodyHeight, documentHeight);
          setIframeHeight(actualHeight + 10); // Reduced padding
        }, 100);
      } catch (e) {
        console.log("Cannot access iframe content for resize:", e);
      }
    };
  };

  // Update iframe when content changes
  useEffect(() => {
    updateIframeContent(emailDetails.body_html);
  }, [emailDetails, expanded]);

  if (!emailDetails) {
    // Can show a placeholder or skeleton loader here
    return <div>Select an email to view its details.</div>;
  }

  // --- Data from your database schema ---
  const {
    id,
    subject,
    from_name,
    from_address,
    to_addresses,
    sent_date,
    body_html,
    is_starred,
  } = emailDetails;

  // Create sanitized markup from the HTML content stored in your DB
  //   const createSanitizedMarkup = () => {
  //     // **SECURITY**: Sanitize HTML from email to prevent XSS attacks
  //     const sanitizedHtml = DOMPurify.sanitize(body_html || "");
  //     return { __html: sanitizedHtml };
  //   };

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <div className="flex max-h-full w-full flex-col">
      {/* Email Body & Details */}
      <div className="flex flex-col overflow-hidden p-4 pt-2">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center">
            {/* Avatar */}
            <div className="mr-3 flex min-h-8 min-w-8 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white md:h-10 md:w-10">
              {from_name ? from_name.charAt(0).toUpperCase() : "?"}
            </div>
            {/* Sender/Recipient Info */}
            <div className="flex flex-col">
              <div className="flex flex-col items-center gap-2 max-sm:w-50 md:flex-row">
                <div className="truncate font-semibold whitespace-nowrap text-primary">
                  {from_name || "Unknown Sender"}
                </div>
                <div className="truncate text-sm text-muted-foreground md:ml-2">
                  {from_address}
                </div>
              </div>
              <div className="hidden text-sm text-muted-foreground md:block">
                to {to_addresses?.join(", ") || "undisclosed-recipients"}
              </div>
            </div>
          </div>
          <div className="flex items-center pl-2 text-xs whitespace-nowrap text-muted-foreground max-sm:mt-1">
            <span className="hidden md:block">{formatDate(sent_date)}</span>
            <div className="flex flex-col items-end md:hidden">
              <span>{formatDate(sent_date, "date")}</span>
              <span>{formatDate(sent_date, "time")}</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-auto rounded-lg border border-gray-300">
          {/* Collapsible Email Content */}
          {expanded && (
            <div className="bg-white p-8 pb-0">
              <iframe
                ref={iframeRef}
                className="w-full border-none"
                style={{ height: `${iframeHeight + 10}px` }}
                sandbox="allow-same-origin"
                title="Email Content"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex justify-center border-t border-accent-foreground/20 p-4 md:justify-end">
        <div className="flex space-x-2 text-muted-foreground">
          <button className="flex cursor-pointer items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-muted hover:text-primary hover:shadow-sm">
            <Reply size={16} className="mr-2" />
            Reply
          </button>
          <button className="flex cursor-pointer items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-muted hover:text-primary hover:shadow-sm">
            <ReplyAll size={16} className="mr-2" />
            Reply all
          </button>
          <button className="flex cursor-pointer items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-muted hover:text-primary hover:shadow-sm">
            <Forward size={16} className="mr-2" />
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailBox;
