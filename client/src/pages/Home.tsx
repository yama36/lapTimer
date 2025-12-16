import { useAuth } from "@/_core/hooks/useAuth";
import { RunnerCard } from "@/components/RunnerCard";
import { LapHistoryModal } from "@/components/LapHistoryModal";
import { SettingsModal } from "@/components/SettingsModal";
import { SummaryModal } from "@/components/SummaryModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { now, secPerKmToClock, secToClock } from "@/lib/timeUtils";
import { AppSettings, Runner, LapRecord } from "@/types";
import { Flag, Play, RotateCcw, StopCircle } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEFAULT_SETTINGS: AppSettings = {
  distanceMeters: 400,
  theme: 'cyberpunk',
  runners: Array.from({ length: 6 }).map((_, i) => ({
    id: nanoid(),
    name: `Runner ${i + 1}`,
    targetPaceMinPerKm: 5.0,
    laps: 0,
    lastLapTime: 0,
    lapHistory: []
  }))
};

const STORAGE_KEY = 'lap_timer_settings';

// Simple hook to get theme (in a real app, use Context)
export function useTheme() {
  const [theme, setTheme] = useState<string>('cyberpunk');
  
  useEffect(() => {
    const checkTheme = () => {
      const current = document.body.getAttribute('data-theme') || 'cyberpunk';
      setTheme(current);
    };
    
    // Initial check
    checkTheme();
    
    // Observer for body attribute changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);
  
  return { theme };
}

export default function Home() {
  // Authentication is disabled - useAuth always returns null user
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showAverages, setShowAverages] = useState(false);

  // Apply theme
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme || 'cyberpunk');
  }, [settings.theme]);

  // Expose theme for child components
  useEffect(() => {
    // This is a workaround to share theme context without a full Context Provider refactor
    // In a larger app, we should use React Context
    (window as any).__CURRENT_THEME__ = settings.theme || 'cyberpunk';
  }, [settings.theme]);

  // Global Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime((now() - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleStart = () => {
    if (isRunning) return;
    const current = now();
    setStartTime(current);
    setIsRunning(true);
    setShowAverages(false);
    
    // Reset runners for new session
    const newRunners = settings.runners.map(r => ({
      ...r,
      laps: 0,
      lastLapTime: current,
      lapHistory: []
    }));
    setSettings({ ...settings, runners: newRunners });
    toast.success("SESSION STARTED", { description: "All units active." });
  };

  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    setSummaryOpen(true); // 計測終了時にサマリーを表示
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setShowAverages(false);
    const newRunners = settings.runners.map(r => ({
      ...r,
      laps: 0,
      lastLapTime: 0,
      lapHistory: []
    }));
    setSettings({ ...settings, runners: newRunners });
    toast.warning("SYSTEM RESET", { description: "Ready for new input." });
  };

  const handleLap = (runnerId: string) => {
    if (!isRunning) return;
    
    const nowTime = now();
    
    const newRunners = settings.runners.map(r => {
      if (r.id !== runnerId) return r;

      const lapSec = (nowTime - r.lastLapTime) / 1000;
      const lapPaceSecPerKm = (lapSec / settings.distanceMeters) * 1000;
      const diffSecPerKm = lapPaceSecPerKm - (r.targetPaceMinPerKm * 60);

      const newLap: LapRecord = {
        lapNumber: r.laps + 1,
        lapSec,
        lapPaceSecPerKm,
        diffSecPerKm,
        timestamp: nowTime
      };

      return {
        ...r,
        laps: r.laps + 1,
        lastLapTime: nowTime,
        lapHistory: [...r.lapHistory, newLap]
      };
    });

    setSettings({ ...settings, runners: newRunners });
  };

  const handleRunnerFinish = (runnerId: string) => {
    const runner = settings.runners.find(r => r.id === runnerId);
    if (runner) {
      toast.success(`${runner.name} FINISHED!`);
    }
  };

  const handleUndo = (runnerId: string) => {
    if (!isRunning) return;

    const newRunners = settings.runners.map(r => {
      if (r.id !== runnerId || r.lapHistory.length === 0) return r;

      // 最後のラップを削除
      const newHistory = [...r.lapHistory];
      newHistory.pop();
      
      // 最後のラップタイムを一つ前のラップの終了時間（またはスタート時間）に戻す
      let prevTime = startTime || now();
      if (newHistory.length > 0) {
        prevTime = newHistory[newHistory.length - 1].timestamp;
      }

      return {
        ...r,
        laps: r.laps - 1,
        lastLapTime: prevTime,
        lapHistory: newHistory
      };
    });

    setSettings({ ...settings, runners: newRunners });
    toast.info("LAP UNDONE");
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    toast.success("CONFIGURATION UPDATED");
    setSettingsOpen(false);
  };

  const handleRunnerClick = (runner: Runner) => {
    if (isRunning) return; // 計測中はモーダルを開かない
    setSelectedRunner(runner);
    setHistoryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        settings.theme === 'cyberpunk' ? 'border-b border-border/40 bg-background/80 backdrop-blur-md' :
        settings.theme === 'pop' ? 'bg-primary/10 border-b-2 border-primary/20 backdrop-blur-sm' :
        settings.theme === 'colorful' ? 'bg-white/80 backdrop-blur-md shadow-sm' :
        'border-b border-border bg-background/95 backdrop-blur-sm'
      }`}>
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              settings.theme === 'cyberpunk' ? 'bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]' : 
              settings.theme === 'pop' ? 'bg-primary border-2 border-black' :
              'bg-primary'
            }`} />
            <h1 className={`text-xl font-display font-bold tracking-widest text-foreground ${
              settings.theme === 'cyberpunk' ? 'neon-text' : 
              settings.theme === 'pop' ? 'text-primary drop-shadow-sm' :
              ''
            }`}>
              {settings.theme === 'cyberpunk' ? <>CHRONO<span className="text-primary">SYNC</span></> :
               settings.theme === 'simple' ? 'Lap Timer' :
               settings.theme === 'pop' ? 'LAP TIMER!' :
               'Lap Timer'}
            </h1>
          </div>
          <SettingsModal settings={settings} onSave={handleSettingsSave} />
        </div>
      </header>

      <main className="container flex-1 py-4 h-[calc(100vh-5rem)] overflow-hidden flex flex-col lg:block">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 h-full overflow-y-auto lg:overflow-hidden">
          {/* Left Panel: Global Timer (A1:A2 - 1 column, full height on Desktop, Top on Mobile) */}
          <section className="lg:col-span-1 lg:h-full flex flex-col shrink-0">
            <div className="relative flex-1 min-h-[300px] lg:min-h-0">
              <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
              <Card className={`relative h-full overflow-hidden shadow-2xl flex flex-col justify-center ${
                settings.theme === 'cyberpunk' 
                  ? 'bg-black/60 border-primary/30 backdrop-blur-xl' 
                  : settings.theme === 'pop'
                    ? 'bg-white/80 border-2 border-primary shadow-[4px_4px_0px_var(--primary)] rounded-3xl'
                    : settings.theme === 'colorful'
                      ? 'bg-white border-2 border-primary shadow-lg rounded-2xl'
                      : 'bg-card border-border shadow-sm'
              }`}>
                {settings.theme === 'cyberpunk' && (
                  <>
                    <div className="absolute inset-0 bg-[url('/images/timer_display_bg.jpg')] opacity-20 bg-cover bg-center mix-blend-overlay" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                  </>
                )}
                
                <div className="relative p-4 text-center flex flex-col h-full justify-between">
                  <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                    <div className="text-xs text-muted-foreground font-display tracking-[0.2em] uppercase">
                      Total Time
                    </div>
                    {/* Font size adjusted to fit the narrower column */}
                    <div className={`text-[15vw] lg:text-[6vw] font-mono font-bold text-primary tracking-tighter tabular-nums leading-none ${settings.theme === 'cyberpunk' ? 'neon-text' : ''}`} style={{ maxFontSize: '124px', fontSize: 'min(15vw,124px)', maxWidth: '100%' }}>
                      {secToClock(elapsedTime)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-auto">
                    {!isRunning ? (
                      <Button 
                        size="lg" 
                        onClick={handleStart}
                        className={`w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display text-xl h-16 lg:h-20 transition-all hover:scale-[1.02] ${
                          settings.theme === 'cyberpunk' ? 'shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 
                          settings.theme === 'pop' ? 'shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] rounded-xl border-2 border-black' : 
                          settings.theme === 'colorful' ? 'shadow-lg hover:shadow-xl rounded-xl' :
                          ''
                        }`}
                      >
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        START
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        onClick={handleStop}
                        className={`w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-display text-xl h-16 lg:h-20 transition-all hover:scale-[1.02] ${
                          settings.theme === 'cyberpunk' ? 'shadow-[0_0_20px_rgba(188,19,254,0.3)]' : 
                          settings.theme === 'pop' ? 'shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] rounded-xl border-2 border-black' : 
                          settings.theme === 'colorful' ? 'shadow-lg hover:shadow-xl rounded-xl' :
                          ''
                        }`}
                      >
                        <Flag className="w-6 h-6 mr-2 fill-current" />
                        FINISH
                      </Button>
                    )}
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={handleReset}
                      className={`w-full font-display text-lg h-12 ${
                        settings.theme === 'cyberpunk' ? 'border-destructive/50 text-destructive hover:bg-destructive/10' :
                        settings.theme === 'pop' ? 'border-2 border-destructive text-destructive hover:bg-destructive/10 shadow-[2px_2px_0px_var(--destructive)] rounded-xl' :
                        'border-destructive/50 text-destructive hover:bg-destructive/10'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      RESET
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Right Panel: Runners Grid (B1:D2 - 3 columns, 2 rows on Desktop, Stacked on Mobile) */}
          <section className="lg:col-span-3 lg:h-full pb-20 lg:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 lg:h-full">
              {settings.runners.slice(0, 6).map(runner => (
                <div key={runner.id} className="h-auto lg:h-full min-h-[200px]">
                  <RunnerCard 
                    runner={runner} 
                    onLap={handleLap}
                    onUndo={handleUndo}
                    onFinish={handleRunnerFinish}
                    isRunning={isRunning}
                    onClick={handleRunnerClick}
                    distanceMeters={settings.distanceMeters}
                  />
                </div>
              ))}
              {/* Fill empty slots if less than 6 runners (Desktop only) */}
              {Array.from({ length: Math.max(0, 6 - settings.runners.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="hidden lg:block h-full opacity-30 pointer-events-none">
                  <Card className="h-full bg-black/20 border-dashed border-border/30 flex items-center justify-center">
                    <span className="text-muted-foreground font-display text-sm">EMPTY SLOT</span>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Averages Report */}
        {showAverages && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/90 border-secondary/30">
              <div className="p-6 border-b border-border/30 flex items-center gap-3">
                <StopCircle className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-display text-secondary neon-text-secondary">
                  SESSION REPORT
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.runners.map(runner => {
                  if (runner.lapHistory.length === 0) return null;
                  const avgPace = runner.lapHistory.reduce((acc, cur) => acc + cur.lapPaceSecPerKm, 0) / runner.lapHistory.length;
                  
                  return (
                    <div key={runner.id} className="flex justify-between items-center p-4 bg-black/40 rounded border border-border/30">
                      <span className="font-display text-foreground">{runner.name}</span>
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-primary">
                          {secPerKmToClock(avgPace)} <span className="text-xs text-muted-foreground">/km</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase">AVG PACE</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        <LapHistoryModal 
          runner={selectedRunner}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
        
        <SummaryModal 
          isOpen={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          runners={settings.runners}
        />
      </main>
    </div>
  );
}
