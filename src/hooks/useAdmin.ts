import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Review = Tables<"reviews">;

export const useIsAdmin = () => {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return false;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
  });
};

export const useAllReviews = (status?: string) => {
  return useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [];
      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
      const { error } = await supabase
        .from("reviews")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useAllProducts = () => {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
