"use client";

import { useEffect, useRef, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderCircleIcon, PlusCircle, XCircle } from "lucide-react";
import { useUIStore } from "@/store/UserStore";
import { useShallow } from "zustand/react/shallow";
import { useIsMobile } from "@/hooks/use-mobile";
import AccountsDropdown from "./AccountsDropdown";

export default function Avatars() {
  const {
    selectedEmailAccountIds,
    setSelectedEmailAccountIds,
    connectedGmailAccounts,
  } = useUIStore(
    useShallow((store) => ({
      selectedEmailAccountIds: store.selectedEmailAccountIds,
      connectedGmailAccounts: store.userData?.gmail_accounts,
      setSelectedEmailAccountIds: store.setSelectedEmailAccountIds,
    }))
  );
  const isMobileView = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedEmailAccounts, setSelectedEmailAccounts] = useState([]);
  const [otherEmailAccounts, setOtherEmailAccounts] = useState([]);
  const [isDropdownOpen, setIsDropDownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropDownOpen] = useState(false);

  ////////
  const divRef = useRef();
  function handleMouseLeave(e) {
    const related = e.relatedTarget;

    if (!related || !divRef.current?.contains(related)) {
      setIsExpanded(false);
    }
  }

  useEffect(() => {
    if (!isDropdownOpen) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    setTimeout(() => {
      setIsExpanded(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const other = connectedGmailAccounts?.filter((account) => {
      const temp = selectedEmailAccountIds?.find((id) => account.id === id)
        ? false
        : true;
      return temp;
    });
    setOtherEmailAccounts(other);
    const selected = selectedEmailAccountIds
      .map((id) => connectedGmailAccounts?.find((account) => account.id === id))
      .filter(Boolean);
    setSelectedEmailAccounts(selected);
  }, [selectedEmailAccountIds, connectedGmailAccounts]);

  function removeSelectedAccount(accountId) {
    if (selectedEmailAccountIds.length > 1) {
      const filteredAccountIds = selectedEmailAccountIds.filter(
        (id) => id !== accountId
      );
      setSelectedEmailAccountIds(filteredAccountIds);
    } else {
      alert("Atleast one account needs to remain selected");
    }
  }

  function addSelectedAccount(accountId) {
    setIsDropDownOpen(false);
    setSelectedEmailAccountIds([...selectedEmailAccountIds, accountId]);
  }

  if (selectedEmailAccounts.length === 0) return <LoaderCircleIcon />;

  const triggerComponent = (
    <PlusCircle className="h-5 w-5 text-foreground/70" />
  );

  return (
    <>
      {isMobileView ? (
        <AccountsDropdown
          isDropdownOpen={isDropdownOpen}
          setIsDropDownOpen={setIsDropDownOpen}
          otherEmailAccounts={otherEmailAccounts}
          selectedEmailAccounts={selectedEmailAccounts}
          addSelectedAccount={addSelectedAccount}
          removeSelectedAccount={removeSelectedAccount}
          TriggerComponent={
            <div className="flex items-center justify-start">
              <div
                onPointerEnter={() => {
                  if (!isMobileView) {
                    setIsExpanded(true);
                  } else {
                    setIsMobileDropDownOpen(true);
                  }
                }}
                onPointerLeave={handleMouseLeave}
                className="relative py-4"
                ref={divRef}
              >
                <LayoutGroup>
                  <motion.div
                    layout
                    className={`flex items-center ${isExpanded ? "gap-1" : ""}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {isExpanded && !isMobileView && (
                      <motion.div
                        layoutId="add-button"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="bg-white-800 flex h-6 w-6 flex-shrink-0 items-center justify-center text-black"
                      >
                        {!isMobileView && (
                          <AccountsDropdown
                            isDropdownOpen={isDropdownOpen}
                            setIsDropDownOpen={setIsDropDownOpen}
                            otherEmailAccounts={otherEmailAccounts}
                            addSelectedAccount={addSelectedAccount}
                            TriggerComponent={triggerComponent}
                          />
                        )}
                      </motion.div>
                    )}

                    {selectedEmailAccounts.map((user, index) => (
                      <motion.div
                        key={user.id}
                        layout
                        className={`flex items-center overflow-hidden rounded-full ${
                          isExpanded
                            ? "gap-1 bg-muted py-0.5 pr-2 pl-1"
                            : "border-2 border-background"
                        } ${!isExpanded && index > 0 ? "-ml-1.5" : ""}`}
                        style={{ zIndex: selectedEmailAccounts.length - index }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage
                            src={user.avatar_url}
                            alt={user.gmail_address}
                          />
                          <AvatarFallback>
                            {user.gmail_address.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <motion.div
                          initial={{ opacity: 0, maxWidth: 0 }}
                          animate={{
                            opacity: isExpanded ? 1 : 0,
                            maxWidth: isExpanded ? "2000px" : 0,
                            marginLeft: isExpanded ? "0.3rem" : 0,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className="flex items-center gap-1"
                        >
                          <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                            {user.gmail_address}
                          </span>
                          <XCircle
                            className="h-4 min-w-4 cursor-pointer text-muted-foreground hover:scale-110"
                            onClick={() => removeSelectedAccount(user.id)}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                </LayoutGroup>
              </div>
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-start">
          <div
            onPointerEnter={() => {
              if (!isMobileView) {
                setIsExpanded(true);
              } else {
                setIsMobileDropDownOpen(true);
              }
            }}
            onPointerLeave={handleMouseLeave}
            className="relative py-4"
            ref={divRef}
          >
            <LayoutGroup>
              <motion.div
                layout
                className={`flex items-center ${isExpanded ? "gap-1" : ""}`}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {isExpanded && !isMobileView && (
                  <motion.div
                    layoutId="add-button"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white-800 flex h-6 w-6 flex-shrink-0 items-center justify-center text-black"
                  >
                    {!isMobileView && (
                      <AccountsDropdown
                        isDropdownOpen={isDropdownOpen}
                        setIsDropDownOpen={setIsDropDownOpen}
                        otherEmailAccounts={otherEmailAccounts}
                        addSelectedAccount={addSelectedAccount}
                        TriggerComponent={triggerComponent}
                      />
                    )}
                  </motion.div>
                )}

                {selectedEmailAccounts.map((user, index) => (
                  <motion.div
                    key={user.id}
                    layout
                    className={`flex items-center overflow-hidden rounded-full ${
                      isExpanded
                        ? "gap-1 bg-muted py-0.5 pr-2 pl-1"
                        : "border-2 border-background"
                    } ${!isExpanded && index > 0 ? "-ml-1.5" : ""}`}
                    style={{ zIndex: selectedEmailAccounts.length - index }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Avatar className="h-5 w-5 flex-shrink-0">
                      <AvatarImage
                        src={user.avatar_url}
                        alt={user.gmail_address}
                      />
                      <AvatarFallback>
                        {user.gmail_address.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <motion.div
                      initial={{ opacity: 0, maxWidth: 0 }}
                      animate={{
                        opacity: isExpanded ? 1 : 0,
                        maxWidth: isExpanded ? "2000px" : 0,
                        marginLeft: isExpanded ? "0.3rem" : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="flex items-center gap-1"
                    >
                      <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                        {user.gmail_address}
                      </span>
                      <XCircle
                        className="h-4 min-w-4 cursor-pointer text-muted-foreground hover:scale-110"
                        onClick={() => removeSelectedAccount(user.id)}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </LayoutGroup>
          </div>
        </div>
      )}
    </>
  );
}
