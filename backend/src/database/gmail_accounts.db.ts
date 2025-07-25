import { UUID } from "crypto";
import { BadRequestError, InternalServerError } from "../errors/specificErrors";
import {
  GmailAccount,
  GmailAccountWithToken,
  NewGmailAccountPayload,
} from "../types/gmail.types";
import supabase from "./supabase";

export const createEmailAccount = async (
  newGmailDetails: NewGmailAccountPayload
): Promise<GmailAccount> => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .insert([newGmailDetails])
    .select();
  if (error) {
    console.log(error);
    throw new BadRequestError("Invalid user data provided.", "DB_ENTRY_ERROR");
  }
  console.log(data);
  const [dataObj] = data;
  return dataObj;
};

export const duplicateAccountCheck = async (google_id: string) => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("*")
    .eq("google_user_id_for_account", google_id);

  if (error) {
    console.error(error);
    throw new BadRequestError(
      "Unable to check duplicate accounts",
      "DB_CHECK_ERROR"
    );
  }
  console.log(data);
  if (data) {
    return false;
  } else return true;
};

export const getAllConnectedAccountTokenDetails = async (
  appUserId: UUID
): Promise<GmailAccountWithToken[]> => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("id, gmail_address, refresh_token_encrypted") // Only fetch what's needed for revocation
    .eq("app_user_id", appUserId);

  if (error) {
    throw new InternalServerError(
      "Failed to fetch Gmail accounts for token revocation."
    );
  }

  return data || [];
};

export const getUserIdByGmailAccountId = async (gmailAccountId: UUID) => {
  console.log(gmailAccountId);
  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("app_user_id, refresh_token_encrypted, type")
    .eq("id", gmailAccountId)
    .single();

  if (error) {
    console.error(error);
    throw new InternalServerError(
      "Failed to get user id of this gmail account from DB"
    );
  }
  return data;
};

export const deleteGmailAccount = async (gmailAccountId: UUID) => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .delete()
    .eq("id", gmailAccountId);

  if (error) {
    throw new InternalServerError("Unable to delete gmail account from DB");
  }
};

export const getEncryptedRefreshToken = async (
  appUserId: string,
  gmailAccountId: string
) => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("refresh_token_encrypted")
    .eq("id", gmailAccountId)
    .eq("app_user_id", appUserId)
    .single();

  if (error) {
    console.error(error);
    throw new InternalServerError(
      "Unable get encrypted refresh token for this email from DB"
    );
  }

  return data;
};

export const getLinkedAccountsForUser = async (
  appUserId: UUID
): Promise<GmailAccountWithToken[]> => {
  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("id")
    .eq("app_user_id", appUserId);

  if (error) {
    throw new InternalServerError(
      "Failed to fetch Gmail accounts for token revocation."
    );
  }

  return data || [];
};
