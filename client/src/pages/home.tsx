import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, isWeekend, startOfDay, isBefore, parse } from "date-fns";
import { BriefcaseBusiness, CalendarClock, Share2, Check, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useHolidays } from "@/hooks/use-holidays";

const STORAGE_KEY = "countdown-settings";

function loadFromUrl(): { title?: string; date?: Date; excludeHolidays?: boolean; adjustment?: number } | null {
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");
  const dateStr = params.get("date");
  const hk = params.get("hk");
  const adj = params.get("adj");

  if (!title && !dateStr && hk === null && adj === null) return null;

  const result: { title?: string; date?: Date; excludeHolidays?: boolean; adjustment?: number } = {};
  if (title) result.title = decodeURIComponent(title);
  if (dateStr) {
    const parsed = parse(dateStr, "yyyyMMdd", new Date());
    if (!isNaN(parsed.getTime())) result.date = parsed;
  }
  if (hk !== null) result.excludeHolidays = hk === "1";
  if (adj !== null) {
    const n = parseInt(adj, 10);
    if (!isNaN(n)) result.adjustment = n;
  }
  return result;
}

function loadFromStorage(): { title?: string; date?: string; excludeHolidays?: boolean; adjustment?: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Home() {
  const { toast } = useToast();
  const today = startOfDay(new Date());

  const initialState = useMemo(() => {
    const fromUrl = loadFromUrl();
    const fromStorage = loadFromStorage();

    let title = "";
    let date = addDays(today, 30);
    let excludeHolidays = false;
    let adjustment = 0;

    if (fromUrl) {
      title = fromUrl.title ?? fromStorage?.title ?? "";
      date = fromUrl.date ?? (fromStorage?.date ? new Date(fromStorage.date) : date);
      excludeHolidays = fromUrl.excludeHolidays ?? fromStorage?.excludeHolidays ?? false;
      adjustment = fromUrl.adjustment ?? fromStorage?.adjustment ?? 0;
    } else if (fromStorage) {
      title = fromStorage.title ?? "";
      if (fromStorage.date) {
        const d = new Date(fromStorage.date);
        if (!isNaN(d.getTime())) date = d;
      }
      excludeHolidays = fromStorage.excludeHolidays ?? false;
      adjustment = fromStorage.adjustment ?? 0;
    }

    if (isBefore(date, today)) date = addDays(today, 30);

    return { title, date, excludeHolidays, adjustment };
  }, []);

  const [title, setTitle] = useState(initialState.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>(initialState.date);
  const [excludeHolidays, setExcludeHolidays] = useState(initialState.excludeHolidays);
  const [adjustment, setAdjustment] = useState(initialState.adjustment);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const data = {
      title,
      date: targetDate.toISOString(),
      excludeHolidays,
      adjustment,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [title, targetDate, excludeHolidays, adjustment]);

  const { data: holidays, isLoading, isError, error } = useHolidays(excludeHolidays);

  useEffect(() => {
    if (isError && excludeHolidays) {
      toast({
        title: "Couldn't fetch holidays",
        description: error?.message || "There was a problem syncing with the holiday calendar.",
        variant: "destructive",
      });
      setExcludeHolidays(false);
    }
  }, [isError, excludeHolidays, error, toast]);

  const workingDays = useMemo(() => {
    const end = startOfDay(targetDate);

    if (!isBefore(today, end)) {
      return 0;
    }

    let days = 0;
    let current = addDays(today, 1);
    const holidaySet = new Set(holidays || []);

    while (current <= end) {
      if (!isWeekend(current)) {
        const dateStr = format(current, "yyyyMMdd");
        const isHoliday = excludeHolidays && holidaySet.has(dateStr);

        if (!isHoliday) {
          days++;
        }
      }
      current = addDays(current, 1);
    }

    return Math.max(0, days - adjustment);
  }, [targetDate, today, holidays, excludeHolidays, adjustment]);

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams();
    if (title) params.set("title", encodeURIComponent(title));
    params.set("date", format(targetDate, "yyyyMMdd"));
    params.set("hk", excludeHolidays ? "1" : "0");
    if (adjustment > 0) params.set("adj", String(adjustment));

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with others to show your countdown." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", description: url, variant: "destructive" });
    }
  }, [title, targetDate, excludeHolidays, adjustment, toast]);

  return (
    <div className="relative min-h-screen bg-secondary/30 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="relative w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] border-none shadow-2xl shadow-black/[0.02] bg-background/80 backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center space-y-10">

          {/* Header */}
          <div className="space-y-3 w-full">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 text-primary mb-2">
              <CalendarClock className="w-6 h-6" />
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 justify-center max-w-xs mx-auto">
                <Input
                  data-testid="input-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Deadline"
                  className="text-center font-display text-sm font-bold uppercase tracking-wider"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingTitle(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-save-title"
                  onClick={() => setIsEditingTitle(false)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="group flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
                data-testid="button-edit-title"
              >
                <h1 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]" data-testid="text-heading">
                  {title || (excludeHolidays ? "Working Days Left" : "Days Left")}
                </h1>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* Main Number Display */}
          <div className="relative flex justify-center items-center h-40 w-full">
            {isLoading && excludeHolidays ? (
              <div className="flex flex-col items-center space-y-4 animate-pulse">
                <div className="w-24 h-24 bg-secondary rounded-full" />
                <div className="text-xs font-display font-medium text-muted-foreground uppercase tracking-widest">
                  Syncing Calendar...
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                <span
                  data-testid="text-days-count"
                  className="font-display text-8xl sm:text-[9rem] leading-none font-bold tracking-tighter text-foreground drop-shadow-sm transition-all duration-500"
                >
                  {workingDays}
                </span>
                <span className="font-display text-lg sm:text-xl font-semibold text-muted-foreground tracking-wide pb-2 whitespace-pre-line leading-tight text-left" data-testid="text-days-label">
                  {excludeHolidays ? "working\ndays left" : "days\nleft"}
                </span>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-border/40" />

          {/* Controls */}
          <div className="w-full space-y-6">

            {/* Title Field */}
            <div className="flex flex-col space-y-3 text-left">
              <label className="font-display text-sm font-semibold text-foreground ml-1">
                Countdown Title
              </label>
              <Input
                data-testid="input-title-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Deadline"
              />
            </div>

            {/* Date Picker */}
            <div className="flex flex-col space-y-3 text-left">
              <label className="font-display text-sm font-semibold text-foreground ml-1">
                Select Target Date
              </label>
              <DatePicker
                date={targetDate}
                setDate={setTargetDate}
                disabled={(date) => date < today}
              />
            </div>

            {/* Adjustment */}
            <div className="flex flex-col space-y-3 text-left">
              <label className="font-display text-sm font-semibold text-foreground ml-1">
                Adjustment (e.g. Time-off, Annual Leave)
              </label>
              <Input
                data-testid="input-adjustment"
                type="number"
                min={0}
                value={adjustment || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setAdjustment(isNaN(v) || v < 0 ? 0 : v);
                }}
                placeholder="Days to subtract"
              />
            </div>

            {/* Exclude Holidays Toggle */}
            <label
              htmlFor="exclude-holidays"
              className="group flex items-start sm:items-center justify-between p-5 rounded-2xl bg-secondary/40 hover:bg-secondary/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-background shadow-sm group-hover:scale-105 transition-transform duration-300 hidden sm:block">
                  <BriefcaseBusiness className="w-5 h-5 text-primary/70" />
                </div>
                <div className="flex flex-col space-y-1 text-left">
                  <span className="font-display font-semibold text-foreground">
                    Exclude HK Holidays
                  </span>
                  <span className="font-body text-sm text-muted-foreground leading-snug">
                    Skip public holidays in the calculation
                  </span>
                </div>
              </div>
              <div className="ml-4 pt-1 sm:pt-0">
                <Switch
                  id="exclude-holidays"
                  checked={excludeHolidays}
                  onCheckedChange={setExcludeHolidays}
                  className="data-[state=checked]:bg-primary"
                  data-testid="switch-exclude-holidays"
                />
              </div>
            </label>

            {/* Share Button */}
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12"
              onClick={handleShare}
              data-testid="button-share"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Share Countdown"}
            </Button>

          </div>
        </div>
      </Card>
    </div>
  );
}
