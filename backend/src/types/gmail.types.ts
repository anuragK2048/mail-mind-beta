import { UUID } from "crypto";
import { boolean } from "zod/v4";

export interface NewGmailAccountPayload {
  app_user_id: UUID;
  google_user_id_for_account: string;
  gmail_address: string;
  gmail_name: string;
  refresh_token_encrypted: string;
  scopes_granted?: string[];
  type: string;
  avatar_url: string | null;
}

export interface GmailAccount extends NewGmailAccountPayload {
  id: UUID;
  created_at: string;
  last_sync_time?: string;
  last_sync_history_id?: string;
  is_sync_active?: boolean;
  sync_error_message?: string;
}

export interface GmailAccountWithToken {
  id: UUID;
  gmail_address: string;
  refresh_token_encrypted: string;
}

/* 
// src/types/auth.types.ts
Type Aliases (type)

export interface OAuthFlowContext {
  action: OAuthFlowAction;
  csrfToken: string; // The 'state' parameter
  appUserId?: string; // If linking to existing user
  // other context-specific data
}

// src/types/api.types.ts
Generics (<T>)
export interface ApiResponse<TData> {
  success: boolean;
  data?: TData;
  error?: string;
  statusCode: number;
}

Union Types (|)
function logId(id: string | number) {
  console.log(`ID is: ${id}`);
  // You might need type guards here if you want to use methods specific to string or number
  if (typeof id === 'string') {
    console.log(id.toUpperCase());
  }
}

interface Auditable {
  createdAt: Date;
  updatedAt: Date;
}

interface EmailContent {
  subject: string;
  body: string;
}

Intersection Types (&)
type StoredEmail = EmailContent & Auditable & { id: string; };

// const email: StoredEmail = {
//   id: 'email-1',
//   subject: 'Hello',
//   body: 'World',
//   createdAt: new Date(),
//   updatedAt: new Date(),
// };

Strict Compiler Options (especially strictNullChecks)

async/await with Proper Typing
// src/services/userService.ts
import { UserProfile } from '../types/user.types'; // Assume this exists

async function fetchUserById(userId: string): Promise<UserProfile | null> {
  try {
    // const user = await db.users.findUnique({ where: { id: userId } });
    // return user;
    return null; // Placeholder
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
*/
