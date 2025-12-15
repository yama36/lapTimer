import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppSettings, Runner, Theme } from "@/types";
import { Settings, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { nanoid } from "nanoid";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsModal({ settings, onSave }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
    setOpen(newOpen);
  };

  const updateDistance = (val: string) => {
    setLocalSettings({ ...localSettings, distanceMeters: Number(val) });
  };

  const updateTheme = (val: Theme) => {
    setLocalSettings({ ...localSettings, theme: val });
  };

  const updateRunner = (index: number, field: keyof Runner, val: string | number) => {
    const newRunners = [...localSettings.runners];
    newRunners[index] = { ...newRunners[index], [field]: val };
    setLocalSettings({ ...localSettings, runners: newRunners });
  };

  const addRunner = () => {
    const newRunner: Runner = {
      id: nanoid(),
      name: `Runner ${localSettings.runners.length + 1}`,
      targetPaceMinPerKm: 5.0,
      laps: 0,
      lastLapTime: 0,
      lapHistory: [],
    };
    setLocalSettings({
      ...localSettings,
      runners: [...localSettings.runners, newRunner],
    });
  };

  const removeRunner = (index: number) => {
    const newRunners = localSettings.runners.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, runners: newRunners });
  };

  const handleSave = () => {
    onSave(localSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`font-display tracking-wider ${
          settings.theme === 'cyberpunk' ? 'border-primary text-primary hover:bg-primary/10 hover:text-primary' :
          settings.theme === 'pop' ? 'border-2 border-primary text-primary hover:bg-primary/10 shadow-[2px_2px_0px_var(--primary)] rounded-xl' :
          settings.theme === 'colorful' ? 'border-2 border-primary text-primary hover:bg-primary/10 rounded-lg' :
          ''
        }`}>
          <Settings className="w-4 h-4 mr-2" />
          {settings.theme === 'cyberpunk' ? 'SYSTEM CONFIG' : 'SETTINGS'}
        </Button>
      </DialogTrigger>
      <DialogContent className="text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle className={`text-2xl font-display ${
            settings.theme === 'cyberpunk' ? 'text-primary neon-text' :
            settings.theme === 'pop' ? 'text-primary' :
            settings.theme === 'colorful' ? 'text-primary' :
            ''
          }`}>
            {settings.theme === 'cyberpunk' ? 'SYSTEM CONFIGURATION' : 'Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="distance" className="text-right text-muted-foreground font-mono">
              DISTANCE (m)
            </Label>
            <Input
              id="distance"
              type="number"
              value={localSettings.distanceMeters}
              onChange={(e) => updateDistance(e.target.value)}
              className={`col-span-3 font-mono text-lg ${
                settings.theme === 'cyberpunk' ? 'bg-background/50 border-primary/30 focus:border-primary' : ''
              }`}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="text-right text-muted-foreground font-mono">
              THEME
            </Label>
            <select
              id="theme"
              value={localSettings.theme || 'cyberpunk'}
              onChange={(e) => updateTheme(e.target.value as Theme)}
              className={`col-span-3 flex h-10 w-full rounded-md border px-3 py-2 text-lg font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.theme === 'cyberpunk' ? 'border-primary/30 bg-background/50 focus-visible:ring-primary' : 
                'border-input bg-background ring-offset-background focus-visible:ring-ring'
              }`}
            >
              <option value="cyberpunk">CYBERPUNK NEON</option>
              <option value="simple">SIMPLE LIGHT</option>
              <option value="pop">POP PINK</option>
              <option value="colorful">COLORFUL</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <Label className={`text-lg font-display ${
                settings.theme === 'cyberpunk' ? 'text-secondary neon-text-secondary' : ''
              }`}>
                {settings.theme === 'cyberpunk' ? 'RUNNERS DATA' : 'Runners'}
              </Label>
              <Button
                size="sm"
                onClick={addRunner}
                className={`${
                  settings.theme === 'cyberpunk' ? 'bg-secondary/20 text-secondary hover:bg-secondary/40 border border-secondary/50' :
                  settings.theme === 'pop' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] rounded-xl' :
                  ''
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {settings.theme === 'cyberpunk' ? 'ADD UNIT' : 'Add Runner'}
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {localSettings.runners.map((runner, index) => (
                  <div
                    key={runner.id}
                    className={`grid grid-cols-12 gap-2 items-end p-3 rounded border ${
                      settings.theme === 'cyberpunk' ? 'bg-background/30 border-border/50' : 'bg-card border-border'
                    }`}
                  >
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground font-mono mb-1 block">
                        {settings.theme === 'cyberpunk' ? 'CODENAME' : 'Name'}
                      </Label>
                      <Input
                        value={runner.name}
                        onChange={(e) => updateRunner(index, "name", e.target.value)}
                        className={`h-8 font-mono ${
                          settings.theme === 'cyberpunk' ? 'bg-black/50 border-primary/20 focus:border-primary/60' : ''
                        }`}
                      />
                    </div>
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground font-mono mb-1 block">
                        {settings.theme === 'cyberpunk' ? 'TARGET PACE (min/km)' : 'Target Pace'}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={runner.targetPaceMinPerKm}
                        onChange={(e) =>
                          updateRunner(index, "targetPaceMinPerKm", Number(e.target.value))
                        }
                        className={`h-8 font-mono ${
                          settings.theme === 'cyberpunk' ? 'bg-black/50 border-primary/20 focus:border-primary/60' : ''
                        }`}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRunner(index)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            CANCEL
          </Button>
          <Button onClick={handleSave} className={`bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-widest ${
            settings.theme === 'pop' ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.1)] rounded-xl' : ''
          }`}>
            {settings.theme === 'cyberpunk' ? 'INITIALIZE' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
