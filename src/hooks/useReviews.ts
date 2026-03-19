import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Review = Tables<"reviews">;

export const useReviews = (category?: string) => {
  return useQuery({
    queryKey: ["reviews", category],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [] as Review[];
      let query = supabase
        .from("reviews")
        .select("*")
        .order("published_at", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category as Review["category"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
  });
};

export const useFeaturedReviews = () => {
  return useQuery({
    queryKey: ["reviews", "featured"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [] as Review[];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as Review[];
    },
  });
};

export const useReview = (slug: string) => {
  return useQuery({
    queryKey: ["review", slug],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!slug,
  });
};
