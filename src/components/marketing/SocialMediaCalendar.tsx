// ============================================================
// SOCIAL MEDIA CALENDAR — Visual calendar of scheduled & posted content
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  CheckCircle2, Clock, XCircle, Send, Trash2, Eye,
} from "lucide-react";
import {
  getMetaPosts,
  saveMetaPost,
  deleteMetaPost,
  publishMetaPost,
  scheduleForPeakTime,
  type MetaPost,
} from "@/services/metaBusinessService";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: MetaPost[];
}

export default function SocialMediaCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<MetaPost[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setPosts(getMetaPosts());
  }, []);

  const refreshPosts = () => {
    setPosts(getMetaPosts());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayPosts = posts.filter((p) => {
        const postDate = p.scheduled_for
          ? new Date(p.scheduled_for)
          : p.posted_at
          ? new Date(p.posted_at)
          : new Date(p.created_at);
        return (
          postDate.getFullYear() === date.getFullYear() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getDate() === date.getDate()
        );
      });

      // Apply filters
      const filteredPosts = dayPosts.filter((p) => {
        if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
        if (filterStatus !== "all" && p.status !== filterStatus) return false;
        return true;
      });

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        posts: filteredPosts,
      });
    }

    return days;
  }, [currentDate, posts, filterPlatform, filterStatus]);

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
    setSelectedDay(null);
  };

  const handlePublishNow = async (post: MetaPost) => {
    const result = await publishMetaPost(post);
    saveMetaPost(result);
    refreshPosts();
  };

  const handleSchedulePeak = (post: MetaPost) => {
    const scheduled = scheduleForPeakTime(post);
    saveMetaPost(scheduled);
    refreshPosts();
  };

  const handleDelete = (postId: string) => {
    deleteMetaPost(postId);
    refreshPosts();
    if (selectedDay) {
      setSelectedDay({
        ...selectedDay,
        posts: selectedDay.posts.filter((p) => p.id !== postId),
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted": return "bg-green-500";
      case "scheduled": return "bg-blue-500";
      case "draft": return "bg-purple-500";
      case "failed": return "bg-red-500";
      case "posting": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted": return <CheckCircle2 className="h-3 w-3" />;
      case "scheduled": return <Clock className="h-3 w-3" />;
      case "failed": return <XCircle className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getPlatformEmoji = (platform: string) => {
    switch (platform) {
      case "facebook": return "📘";
      case "instagram": return "📸";
      case "both": return "📘📸";
      default: return "📱";
    }
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // Stats
  const totalScheduled = posts.filter((p) => p.status === "scheduled").length;
  const totalPosted = posts.filter((p) => p.status === "posted").length;
  const totalDrafts = posts.filter((p) => p.status === "draft").length;
  const totalFailed = posts.filter((p) => p.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalDrafts}</p>
            <p className="text-xs text-gray-400">Drafts</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{totalScheduled}</p>
            <p className="text-xs text-gray-400">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{totalPosted}</p>
            <p className="text-xs text-gray-400">Posted</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{totalFailed}</p>
            <p className="text-xs text-gray-400">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar header */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-400" />
              Social Media Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-32 bg-slate-800 border-purple-500/30 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 bg-slate-800 border-purple-500/30 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold text-white">{monthName}</h3>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`
                  min-h-[70px] p-1 rounded-lg text-left transition-all border
                  ${day.isCurrentMonth ? "bg-slate-800/50" : "bg-slate-900/30 opacity-50"}
                  ${day.isToday ? "border-purple-500 ring-1 ring-purple-500/30" : "border-transparent"}
                  ${selectedDay?.date.getTime() === day.date.getTime() ? "border-blue-500 ring-1 ring-blue-500/30" : ""}
                  hover:border-purple-500/50
                `}
              >
                <span className={`text-xs font-medium ${day.isToday ? "text-purple-400" : "text-gray-300"}`}>
                  {day.date.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {day.posts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={`h-1.5 rounded-full ${getStatusColor(post.status)}`}
                      title={`${getPlatformEmoji(post.platform)} ${post.content.slice(0, 50)}`}
                    />
                  ))}
                  {day.posts.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{day.posts.length - 3}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDay && selectedDay.posts.length > 0 && (
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDay.date.toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </CardTitle>
            <CardDescription>{selectedDay.posts.length} post(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDay.posts.map((post) => (
              <div key={post.id} className="p-3 rounded-lg bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getPlatformEmoji(post.platform)}</span>
                    <Badge variant="outline" className={`text-xs ${
                      post.status === "posted" ? "text-green-400 border-green-400/30" :
                      post.status === "scheduled" ? "text-blue-400 border-blue-400/30" :
                      post.status === "failed" ? "text-red-400 border-red-400/30" :
                      "text-purple-400 border-purple-400/30"
                    }`}>
                      {getStatusIcon(post.status)}
                      <span className="ml-1">{post.status}</span>
                    </Badge>
                    {post.scheduled_for && (
                      <span className="text-xs text-gray-400">
                        {new Date(post.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(post.status === "draft" || post.status === "failed") && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePublishNow(post)}
                          title="Post Now"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSchedulePeak(post)}
                          title="Schedule for Peak Time"
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(post.id)}
                      title="Delete"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 line-clamp-3">{post.content}</p>
                {post.status === "posted" && (
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>🔄 {post.shares}</span>
                    <span>👁️ {post.reach}</span>
                  </div>
                )}
                {post.error_message && (
                  <p className="text-xs text-red-400">Error: {post.error_message}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedDay && selectedDay.posts.length === 0 && (
        <Card className="glass-card border-purple-500/20">
          <CardContent className="py-8 text-center">
            <CalendarIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">No posts scheduled for this day</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
