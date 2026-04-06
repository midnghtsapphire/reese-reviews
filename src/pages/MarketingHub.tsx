// ============================================================
// MARKETING HUB — Unified marketing dashboard
// Combines Meta Business, Social Calendar, Scheduler, and Campaigns
// ============================================================

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import MetaBusinessConnect from "@/components/marketing/MetaBusinessConnect";
import MetaAutoPost from "@/components/marketing/MetaAutoPost";
import SocialMediaCalendar from "@/components/marketing/SocialMediaCalendar";
import MarketingSchedulerUI from "@/components/marketing/MarketingSchedulerUI";

export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <>
      <SEOHead
        title="Marketing Hub"
        description="Manage social media, scheduling, and marketing automation for Reese Reviews"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Marketing Hub</h1>
            <p className="text-gray-300">
              Social media management, content scheduling, and marketing automation
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass-nav mb-6">
              <TabsTrigger value="calendar">Social Calendar</TabsTrigger>
              <TabsTrigger value="auto-post">Auto-Post</TabsTrigger>
              <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
              <TabsTrigger value="meta-connect">Meta Connect</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <SocialMediaCalendar />
            </TabsContent>

            <TabsContent value="auto-post">
              <MetaAutoPost />
            </TabsContent>

            <TabsContent value="scheduler">
              <MarketingSchedulerUI />
            </TabsContent>

            <TabsContent value="meta-connect">
              <MetaBusinessConnect />
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-gray-500 mt-8">
            Social media automation provided by Meta Business API · Marketing scheduler powered by client-side cron
          </p>
        </div>
      </div>
    </>
  );
}
