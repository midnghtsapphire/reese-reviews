// ============================================================
// MUSIC VIDEO CREATOR
// Full-page component for creating music videos with avatar,
// theme selection, attire, lyrics, and video generation.
// ============================================================
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Music, Upload, Play, Video, Image as ImageIcon, Palette,
  Shirt, User, FileText, Loader2, Download, Trash2, Clock,
  CheckCircle2, AlertTriangle, Eye, ChevronRight, Sparkles, X,
} from "lucide-react";
import {
  generateMusicVideo, saveMusicVideo, loadMusicVideos, deleteMusicVideo,
  THEMES, ATTIRE_OPTIONS,
  type MusicVideoTheme, type AvatarAttire, type MusicVideoConfig,
  type MusicVideoProgress, type GeneratedMusicVideo,
} from "@/services/musicVideoService";

export default function MusicVideoCreator() {
  // ─── State ────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [songFile, setSongFile] = useState<File | null>(null);
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<MusicVideoTheme>("sunset-rooftop");
  const [attire, setAttire] = useState<AvatarAttire>("casual");
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<MusicVideoProgress | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedMusicVideo | null>(null);
  const [previousVideos, setPreviousVideos] = useState<GeneratedMusicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const songInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load previous videos
  useEffect(() => {
    setPreviousVideos(loadMusicVideos());
  }, []);

  // ─── Handlers ─────────────────────────────────────────────
  const handleSongUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSongFile(file);
      if (!songName) {
        setSongName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  }, [songName]);

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!songFile) {
      setError("Please upload a song file first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const config: MusicVideoConfig = {
        songFile,
        songName: songName || "Untitled",
        artistName: artistName || "Unknown Artist",
        avatarUrl,
        theme,
        attire,
        lyrics,
      };

      const video = await generateMusicVideo(config, (p) => {
        setProgress(p);
      });

      setGeneratedVideo(video);
      saveMusicVideo(video);
      setPreviousVideos(loadMusicVideos());
      setStep(5);
    } catch (err: any) {
      setError(err.message || "Video generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [songFile, songName, artistName, avatarUrl, theme, attire, lyrics]);

  const handleDelete = useCallback((id: string) => {
    deleteMusicVideo(id);
    setPreviousVideos(loadMusicVideos());
  }, []);

  const canProceed = (s: number) => {
    switch (s) {
      case 1: return !!songFile && !!songName;
      case 2: return true; // avatar is optional
      case 3: return true; // theme has default
      case 4: return true; // attire has default
      default: return true;
    }
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music className="text-primary" size={24} />
            Music Video Creator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your song, choose a vibe, and generate a music video with your avatar
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Sparkles size={12} className="mr-1" /> Beta
        </Badge>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "Song", icon: Music },
          { num: 2, label: "Avatar", icon: User },
          { num: 3, label: "Theme", icon: Palette },
          { num: 4, label: "Attire", icon: Shirt },
          { num: 5, label: "Generate", icon: Video },
        ].map(({ num, label, icon: Icon }, i) => (
          <React.Fragment key={num}>
            <button
              onClick={() => !isGenerating && setStep(num as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === num
                  ? "bg-primary text-primary-foreground"
                  : step > num
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-accent/20 text-muted-foreground"
              }`}
            >
              {step > num ? <CheckCircle2 size={12} /> : <Icon size={12} />}
              {label}
            </button>
            {i < 4 && <ChevronRight size={14} className="text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Upload Song */}
          {step === 1 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music size={18} className="text-primary" />
                  Step 1: Upload Your Song
                </CardTitle>
                <CardDescription>
                  Upload an audio file (MP3, WAV, M4A, OGG). The video length will match your song duration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onClick={() => songInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {songFile ? (
                    <div className="space-y-2">
                      <Music size={32} className="mx-auto text-primary" />
                      <p className="text-sm font-medium">{songFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(songFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs">Change File</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop your song file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP3, WAV, M4A, OGG supported
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={songInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleSongUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Song Name</Label>
                    <Input
                      value={songName}
                      onChange={(e) => setSongName(e.target.value)}
                      placeholder="Enter song title"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Artist Name</Label>
                    <Input
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Enter artist name"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Lyrics (optional — displayed as captions)</Label>
                  <Textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Paste your lyrics here, one line per line. They'll be displayed as captions synced to the video."
                    rows={6}
                    className="bg-background/50 resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceed(1)}
                    className="gap-1"
                  >
                    Next: Avatar <ChevronRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Step 2: Choose Your Avatar
                </CardTitle>
                <CardDescription>
                  Upload your own photo or use a stock avatar. The avatar will be shown in the video scene.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Upload own */}
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {avatarUrl ? (
                      <div className="space-y-2">
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-primary"
                        />
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={24} className="mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload Your Photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  {/* No avatar option */}
                  <button
                    onClick={() => {
                      setAvatarUrl(null);
                      setAvatarFile(null);
                    }}
                    className={`border-2 rounded-xl p-6 text-center transition-all ${
                      !avatarUrl
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <User size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">Use Silhouette Avatar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A stylized silhouette will be used
                    </p>
                  </button>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="gap-1">
                    Next: Theme <ChevronRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Theme */}
          {step === 3 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette size={18} className="text-primary" />
                  Step 3: Pick a Theme
                </CardTitle>
                <CardDescription>
                  Choose the visual theme for your music video background and mood.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.entries(THEMES) as [MusicVideoTheme, typeof THEMES[MusicVideoTheme]][]).map(
                    ([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          theme === key
                            ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div
                          className="h-24 w-full"
                          style={{ background: t.gradient }}
                        />
                        <div className="p-2 bg-background/80">
                          <p className="text-xs font-semibold">{t.label}</p>
                          <p className="text-[10px] text-muted-foreground">{t.description}</p>
                        </div>
                        {theme === key && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)} className="gap-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="gap-1">
                    Next: Attire <ChevronRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Attire */}
          {step === 4 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shirt size={18} className="text-primary" />
                  Step 4: Select Attire
                </CardTitle>
                <CardDescription>
                  Choose the outfit style for your avatar in the video.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.entries(ATTIRE_OPTIONS) as [AvatarAttire, typeof ATTIRE_OPTIONS[AvatarAttire]][]).map(
                    ([key, a]) => (
                      <button
                        key={key}
                        onClick={() => setAttire(key)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          attire === key
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <Shirt size={20} className={attire === key ? "text-primary" : "text-muted-foreground"} />
                        <p className="text-sm font-semibold mt-2">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground">{a.description}</p>
                      </button>
                    )
                  )}
                </div>

                <Separator />

                {/* Summary before generation */}
                <div className="p-4 rounded-lg bg-accent/10 border border-white/5 space-y-2">
                  <p className="text-sm font-semibold">Video Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Song:</span> {songName || "Untitled"}</div>
                    <div><span className="text-muted-foreground">Artist:</span> {artistName || "Unknown"}</div>
                    <div><span className="text-muted-foreground">Theme:</span> {THEMES[theme].label}</div>
                    <div><span className="text-muted-foreground">Attire:</span> {ATTIRE_OPTIONS[attire].label}</div>
                    <div><span className="text-muted-foreground">Avatar:</span> {avatarUrl ? "Custom photo" : "Silhouette"}</div>
                    <div><span className="text-muted-foreground">Lyrics:</span> {lyrics ? `${lyrics.split("\n").length} lines` : "None"}</div>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-500/30 bg-red-500/5">
                    <AlertTriangle size={14} className="text-red-400" />
                    <AlertDescription className="text-xs text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(3)} className="gap-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !songFile}
                    className="gap-1"
                  >
                    {isGenerating ? (
                      <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles size={14} /> Generate Music Video</>
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {isGenerating && progress && (
                  <div className="space-y-2">
                    <Progress value={progress.percent} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{progress.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Result */}
          {step === 5 && generatedVideo && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video size={18} className="text-green-400" />
                  Your Music Video is Ready!
                </CardTitle>
                <CardDescription>
                  Preview, download, or create another video.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video preview */}
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                  <video
                    src={generatedVideo.url}
                    controls
                    className="w-full aspect-video"
                    poster={generatedVideo.thumbnailUrl}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 rounded bg-accent/10">
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-semibold">{Math.floor(generatedVideo.durationSeconds / 60)}:{String(Math.floor(generatedVideo.durationSeconds % 60)).padStart(2, "0")}</p>
                  </div>
                  <div className="p-2 rounded bg-accent/10">
                    <span className="text-muted-foreground">Theme</span>
                    <p className="font-semibold">{THEMES[generatedVideo.theme].label}</p>
                  </div>
                  <div className="p-2 rounded bg-accent/10">
                    <span className="text-muted-foreground">Attire</span>
                    <p className="font-semibold">{ATTIRE_OPTIONS[generatedVideo.attire].label}</p>
                  </div>
                  <div className="p-2 rounded bg-accent/10">
                    <span className="text-muted-foreground">Size</span>
                    <p className="font-semibold">{(generatedVideo.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={generatedVideo.url}
                    download={`${generatedVideo.songName}-music-video.webm`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download size={14} /> Download Video
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setGeneratedVideo(null);
                      setSongFile(null);
                      setSongName("");
                      setArtistName("");
                      setLyrics("");
                    }}
                    className="gap-1"
                  >
                    <Music size={14} /> Create Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Previous videos */}
        <div className="space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock size={14} />
                Previous Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previousVideos.length === 0 ? (
                <div className="text-center py-6">
                  <Video size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No videos created yet. Upload a song to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {previousVideos.slice(0, 10).map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-white/5"
                    >
                      <div className="w-12 h-8 rounded bg-accent/30 flex items-center justify-center shrink-0">
                        <Video size={12} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{video.songName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {video.artistName} · {THEMES[video.theme]?.label || video.theme}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(video.id)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips card */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong className="text-foreground">Song Duration:</strong> The video length automatically matches your song. No trimming needed.
              </p>
              <p>
                <strong className="text-foreground">Lyrics:</strong> Paste lyrics line-by-line. They'll appear as synced captions at the bottom of the video.
              </p>
              <p>
                <strong className="text-foreground">Avatar:</strong> Upload a clear, front-facing photo for best results. Square aspect ratio works best.
              </p>
              <p>
                <strong className="text-foreground">Theme:</strong> Choose "Random" to get a surprise theme each time.
              </p>
              <p>
                <strong className="text-foreground">Export:</strong> Videos are generated as WebM. Most video editors and social platforms accept this format.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
