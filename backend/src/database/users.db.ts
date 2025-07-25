import { UUID } from "crypto";
import { BadRequestError, InternalServerError } from "../errors/specificErrors";
import { NewUserAccountPayload, User } from "../types/user.types";

import supabase from "./supabase";

export async function createUser(
  newUserDetails: NewUserAccountPayload
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .insert([newUserDetails])
    .select();
  console.log(data);
  if (error) {
    console.log(error);
    throw new BadRequestError("Invalid user data provided.", "DB_ENTRY_ERROR");
  }
  const [dataObj] = data;
  return dataObj;
}

/* Fetches the app user's profile AND a list of their linked Gmail accounts. */
export async function findUserWithLinkedAccounts(appUserId: string) {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      primary_email,
      avatar_url,
      gmail_accounts(
        id,
        gmail_address,
        is_sync_active,
        last_sync_time,
        type,
        avatar_url
      )
    `
    )
    .eq("id", appUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error finding user with linked accounts:", error);
    throw new Error("Failed to retrieve user profile.");
  }

  return data;
}

export const deleteAppUser = async (userAppId: UUID) => {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", userAppId);

  if (error) {
    throw new InternalServerError("Unable to delete account from DB");
  }
};
