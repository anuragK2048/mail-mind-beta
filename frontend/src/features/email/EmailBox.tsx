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
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
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
    <div className="flex max-h-full flex-grow flex-col">
      {/* Email Body & Details */}
      <div className="flex flex-col overflow-hidden p-4 pt-2">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center">
            {/* Avatar */}
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
              {from_name ? from_name.charAt(0).toUpperCase() : "?"}
            </div>
            {/* Sender/Recipient Info */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-semibold text-primary">
                  {from_name || "Unknown Sender"}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {from_address}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                to {to_addresses?.join(", ") || "undisclosed-recipients"}
                <button
                  onClick={toggleExpand}
                  className="ml-2 inline-block align-middle text-muted-foreground"
                >
                  {expanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center pl-2 text-xs whitespace-nowrap text-muted-foreground">
            {formatDate(sent_date)}
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
      <div className="flex justify-end border-t border-accent-foreground/20 p-4">
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
