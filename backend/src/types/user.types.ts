import { UUID } from "crypto";

export interface NewUserAccountPayload {
  primary_email: string;
  google_id: string;
  full_name: string;
  avatar_url?: string;
  remember_me_token?: string;
  gmail_accounts: string[];
}

export interface User extends NewUserAccountPayload {
  id: UUID;
  created_at: string;
}
