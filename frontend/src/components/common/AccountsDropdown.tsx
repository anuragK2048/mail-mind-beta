import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, XCircle } from "lucide-react";
import { handleAddNewAccount } from "@/api/userApi";
import { useIsMobile } from "@/hooks/use-mobile";

function AccountsDropdown({
  isDropdownOpen,
  setIsDropDownOpen,
  otherEmailAccounts,
  selectedEmailAccounts,
  removeSelectedAccount,
  addSelectedAccount,
  TriggerComponent,
}) {
  const isMobileView = useIsMobile();
  const handleRemoveAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`Removing account: ${accountId}`);
    removeSelectedAccount(accountId);
  };
  return (
    <DropdownMenu onOpenChange={setIsDropDownOpen} open={isDropdownOpen}>
      <DropdownMenuTrigger
        className="cursor-pointer hover:scale-110 focus:outline-none"
        asChild
      >
        {TriggerComponent}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={`${isMobileView ? "-mt-3" : "mt-1"}`}
      >
        <div className="flex flex-col bg-muted">
          {selectedEmailAccounts?.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex w-full gap-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage
                    src={account.avatar_url}
                    alt={account.gmail_address}
                  />
                  <AvatarFallback>
                    {account.gmail_address.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>{account.gmail_address}</div>
                <button
                  type="button"
                  className="ml-auto rounded-full p-1 hover:bg-gray-200"
                  onClick={(e) => handleRemoveAccount(e, account.id)}
                  aria-label={`Remove ${account.gmail_address}`}
                >
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        {isMobileView && <DropdownMenuLabel>Select Account</DropdownMenuLabel>}
        {otherEmailAccounts?.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClickCapture={(e) => {
              e.stopPropagation();
              addSelectedAccount(account.id);
            }}
          >
            <div className="flex gap-2">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage
                  src={account.avatar_url}
                  alt={account.gmail_address}
                />
                <AvatarFallback>
                  {account.gmail_address.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>{account.gmail_address}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem>
          <Button
            className="h-5 w-full cursor-pointer"
            variant={"link"}
            onClick={handleAddNewAccount}
          >
            Add Another Account +
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountsDropdown;
