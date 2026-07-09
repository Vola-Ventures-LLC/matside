import { useState, useEffect } from "react";
import { Globe, Clock, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocale, SUPPORTED_LOCALES, COMMON_TIMEZONES } from "@/hooks/useLocale";

export function LocaleSettings() {
  const {
    locale,
    timezone,
    updateLocale,
    updateTimezone,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    isLoading,
  } = useLocale();

  const [localeSaved, setLocaleSaved] = useState(false);
  const [timezoneSaved, setTimezoneSaved] = useState(false);

  // Auto-hide success indicators
  useEffect(() => {
    if (localeSaved) {
      const timer = setTimeout(() => setLocaleSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [localeSaved]);

  useEffect(() => {
    if (timezoneSaved) {
      const timer = setTimeout(() => setTimezoneSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [timezoneSaved]);

  const handleLocaleChange = async (value: string) => {
    await updateLocale(value);
    setLocaleSaved(true);
  };

  const handleTimezoneChange = async (value: string) => {
    await updateTimezone(value);
    setTimezoneSaved(true);
  };

  // Group locales by region
  const localesByRegion = SUPPORTED_LOCALES.reduce((acc, loc) => {
    if (!acc[loc.region]) acc[loc.region] = [];
    acc[loc.region].push(loc);
    return acc;
  }, {} as Record<string, typeof SUPPORTED_LOCALES[number][]>);

  // Group timezones by region
  const timezonesByRegion = COMMON_TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, typeof COMMON_TIMEZONES[number][]>);

  const now = new Date();
  const sampleNumber = 1234567.89;
  const sampleCents = 199900; // $1,999.00

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Regional Settings</CardTitle>
        </div>
        <CardDescription>
          Configure how dates, times, numbers, and currency are displayed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Locale Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="locale">Format & Language</Label>
            {localeSaved && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
          <Select value={locale} onValueChange={handleLocaleChange} disabled={isLoading}>
            <SelectTrigger id="locale" className="w-full">
              <SelectValue placeholder="Select locale" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(localesByRegion).map(([region, locales]) => (
                <SelectGroup key={region}>
                  <SelectLabel>{region}</SelectLabel>
                  {locales.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Affects how dates, numbers, and currency are formatted throughout the app.
          </p>
        </div>

        <Separator />

        {/* Timezone Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="timezone">Timezone</Label>
            {timezoneSaved && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
          <Select value={timezone} onValueChange={handleTimezoneChange} disabled={isLoading}>
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timezonesByRegion).map(([region, zones]) => (
                <SelectGroup key={region}>
                  <SelectLabel>{region}</SelectLabel>
                  {zones.map((tz) => (
                    <SelectItem key={tz.zone} value={tz.zone}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Times will be displayed in your selected timezone.
          </p>
        </div>

        <Separator />

        {/* Preview Section */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">Preview</Label>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{formatDate(now)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{formatTime(now)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Number:</span>
              <span className="font-medium">{formatNumber(sampleNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span className="font-medium">{formatCurrency(sampleCents)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
