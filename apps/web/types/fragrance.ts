// types/fragrance.ts

/**
 * Canonical fragrance type used across the frontend.
 * `bottle_id` maps 1:1 to backend `original_index`.
 */
export interface Fragrance {
  bottle_id: number; // canonical ID (original_index)

  brand: string;
  name: string;

  image_url: string | null;

  year: number | null;
  gender: string | null;

  rating_value: number | null;
  rating_count: number | null;

  main_accords: string[];

  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
}

/**
 * Lightweight version for card displays (lists, grids)
 */
export type FragranceCard = Pick<
  Fragrance,
  | "bottle_id"
  | "brand"
  | "name"
  | "image_url"
  | "gender"
  | "main_accords"
  | "notes"
  | "rating_value"
>;
