export type OAuthFlowAction =
  | "register_new_user/login"
  | "link_new_gmail_account"
  | "reauthenticate";

export interface ValidatedUser {
  googleId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  refreshToken: string;
}
