export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  sns_links: Record<string, string>;
  role: "maker" | "buyer" | "admin";
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  total_internal_revenue_cents: number;
  total_external_revenue_cents: number;
  graduated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicProfile = Pick<
  Profile,
  | "id"
  | "display_name"
  | "bio"
  | "sns_links"
  | "stripe_onboarding_complete"
  | "total_internal_revenue_cents"
  | "total_external_revenue_cents"
  | "graduated_at"
  | "created_at"
>;

export type Comment = {
  id: string;
  product_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: { display_name: string | null };
};

export type FeatureRequest = {
  id: string;
  product_id: string;
  author_id: string;
  title: string;
  vote_count: number;
  created_at: string;
  user_voted?: boolean;
};

export type MakerPost = {
  id: string;
  maker_id: string;
  product_id: string | null;
  body: string;
  created_at: string;
};

export type WishlistEntry = {
  id: string;
  buyer_id: string;
  product_id: string;
  created_at: string;
};
