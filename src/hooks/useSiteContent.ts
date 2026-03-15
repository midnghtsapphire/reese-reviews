import { useState, useEffect, useCallback } from "react";
import { getSiteContent, saveSiteContent, SiteContent } from "@/lib/siteContentStore";

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(getSiteContent);

  const refresh = useCallback(() => {
    setContent(getSiteContent());
  }, []);

  useEffect(() => {
    window.addEventListener("site-content-updated", refresh);
    return () => window.removeEventListener("site-content-updated", refresh);
  }, [refresh]);

  const update = useCallback(
    (partial: Partial<SiteContent>) => {
      const updated = saveSiteContent(partial);
      setContent(updated);
    },
    []
  );

  return { content, update, refresh };
}
