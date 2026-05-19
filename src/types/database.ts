export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: "maker" | "buyer" | "admin";
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};
