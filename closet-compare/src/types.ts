export type ItemStatus = "considering" | "bought" | "dropped";

export type Wishlist = {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  share_token: string;
  created_at: string;
};

export type Item = {
  id: string;
  url: string;
  store: string;
  name: string;
  price: number | null;
  notes: string | null;
  tags: string[];
  status: ItemStatus;
  decision_reason: string | null;
  image_url: string | null;
  user_id: string;
  wishlist_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  created_at: string;
  onboarding_complete?: boolean;
};

export type WishlistShare = {
  id: string;
  wishlist_id: string;
  owner_user_id: string;
  recipient_user_id: string;
  created_at: string;
  // Joined fields from profiles
  owner_username?: string;
  recipient_username?: string;
};

export type ItemReaction = {
  item_id: string;
  user_id: string;
  reaction: 1 | -1;
};

export type ItemScore = {
  item_id: string;
  score: number;
  likes: number;
  dislikes: number;
  total_votes: number;
};
  