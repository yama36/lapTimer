import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { secPerKmToClock, secToClock } from "@/lib/timeUtils";
import { Runner } from "@/types";
import { Activity, Clock, Timer } from "lucide-react";

interface RunnerCardProps {
  runner: Runner;
  onLap: (runnerId: string) => void;
  onUndo?: (runnerId: string) => void;
  onFinish?: (runnerId: string) => void;
  isRunning: boolean;
  onClick?: (runner: Runner) => void;
  distanceMeters?: number;
}

import { useTheme } from "@/pages/Home";

export function RunnerCard({ runner, onLap, onUndo, onFinish, isRunning, onClick, distanceMeters = 400 }: RunnerCardProps) {
  const { theme } = useTheme();
  const lastLap = runner.lapHistory[runner.lapHistory.length - 1];
  
  // 差分の表示色判定
  let diffColor = "text-muted-foreground";
  let diffText = "--";
  let paceText = "--:--";
  let lapTimeText = "--:--";

  if (lastLap) {
    // 1周あたりの差分を計算
    // diffSecPerKm は1kmあたりの差分なので、周回距離(km)を掛けて1周あたりの差分にする
    const distanceKm = distanceMeters / 1000;
    const diffPerLap = lastLap.diffSecPerKm * distanceKm;
    
    diffColor = diffPerLap > 0 
      ? (theme === 'cyberpunk' ? "text-destructive neon-text-destructive" : "text-destructive") 
      : (theme === 'cyberpunk' ? "text-primary neon-text" : "text-primary");
    diffText = `${diffPerLap > 0 ? "+" : ""}${diffPerLap.toFixed(1)} sec`;
    paceText = secToClock(lastLap.lapPaceSecPerKm);
    lapTimeText = secToClock(lastLap.lapSec);
  }

  return (
    <Card 
      className={`overflow-hidden relative group transition-all duration-300 h-full flex flex-col cursor-pointer ${
        theme === 'cyberpunk' ? 'glass-panel hover:border-primary/50' :
        theme === 'pop' ? 'border-2 border-border shadow-[4px_4px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--border)] rounded-2xl' :
        theme === 'colorful' ? 'border-2 border-border shadow-md hover:shadow-lg rounded-xl' :
        'hover:border-primary/50'
      }`}
      onClick={(e) => {
        // Prevent modal opening when clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        onClick?.(runner);
      }}
    >
      {/* Decorative corner accents - Only for Cyberpunk */}
      {theme === 'cyberpunk' && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      <CardHeader className={`pb-2 pt-4 px-4 border-b ${
        theme === 'cyberpunk' ? 'border-border/30 bg-muted/20' : 
        theme === 'pop' ? 'border-border border-b-2 bg-muted/30' :
        'border-border/30 bg-muted/20'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-display text-foreground tracking-wide truncate">
              {runner.name}
            </CardTitle>
            <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              TARGET: {runner.targetPaceMinPerKm.toFixed(2)} /km
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-mono font-bold leading-none ${
              theme === 'cyberpunk' ? 'text-secondary neon-text-secondary' : 'text-secondary'
            }`}>
              {runner.laps}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">LAPS</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
        {/* 最新ラップ情報 - コンパクト化 */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-1.5 rounded border ${
            theme === 'cyberpunk' ? 'bg-muted/40 border-border/30' : 
            theme === 'pop' ? 'bg-white border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,0.05)]' :
            'bg-muted/40 border-border/30'
          }`}>
            <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
              <Timer className="w-2.5 h-2.5" /> LAP
            </div>
            <div className="text-lg font-mono font-bold text-foreground tracking-tight leading-none">
              {lapTimeText}
            </div>
          </div>
          <div className={`p-1.5 rounded border ${
            theme === 'cyberpunk' ? 'bg-muted/40 border-border/30' : 
            theme === 'pop' ? 'bg-white border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,0.05)]' :
            'bg-muted/40 border-border/30'
          }`}>
            <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1 mb-0.5">
              <Clock className="w-2.5 h-2.5" /> PACE
            </div>
            <div className="text-lg font-mono font-bold text-foreground tracking-tight leading-none">
              {paceText}
            </div>
          </div>
        </div>

        {/* 差分情報 - コンパクト化 */}
        <div className={`flex items-center justify-between p-1.5 rounded border ${
          theme === 'cyberpunk' ? 'bg-muted/20 border-border/20' : 
          theme === 'pop' ? 'bg-muted/10 border-2 border-border' :
          'bg-muted/20 border-border/20'
        }`}>
          <span className="text-[9px] text-muted-foreground uppercase">DIFF (LAP)</span>
          <span className={`text-base font-mono font-bold ${diffColor} leading-none`}>
            {diffText}
          </span>
        </div>

        {/* ラップ履歴（全件） - スクロール可能 */}
        <div className={`h-[80px] overflow-hidden border rounded relative ${
          theme === 'cyberpunk' ? 'border-border/10 bg-muted/10' : 
          theme === 'pop' ? 'border-2 border-border bg-white' :
          'border-border/10 bg-muted/10'
        }`}>
          <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
            {[...runner.lapHistory].reverse().map((lap, i) => (
              <div key={i} className={`flex justify-between text-[10px] font-mono border-b px-2 py-1 last:border-0 hover:bg-primary/5 transition-colors ${
                theme === 'cyberpunk' ? 'border-border/5' : 'border-border/20'
              }`}>
                <span className="text-muted-foreground w-6">#{runner.lapHistory.length - i}</span>
                <span className="w-12 text-right">{secToClock(lap.lapSec)}</span>
                <span className="text-muted-foreground w-16 text-right">{secToClock(lap.lapPaceSecPerKm)}/km</span>
              </div>
            ))}
            {runner.lapHistory.length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center py-8">NO DATA</div>
            )}
          </div>
          
          {/* Undo Button (Visible only when there is history and running) */}
          {runner.lapHistory.length > 0 && isRunning && (
            <button 
              className={`absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded transition-colors z-10 ${
                theme === 'cyberpunk' ? 'bg-destructive/20 hover:bg-destructive/40 text-destructive border border-destructive/30' :
                theme === 'pop' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive-foreground shadow-[1px_1px_0px_rgba(0,0,0,0.2)]' :
                'bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Undo last lap?")) {
                  onUndo?.(runner.id);
                }
              }}
            >
              UNDO
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-auto">
          <Button 
            className={`col-span-3 font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-14 text-base font-bold ${
              theme === 'cyberpunk' ? 'shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]' :
              theme === 'pop' ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.2)] rounded-xl border-2 border-primary-foreground/20' : 
              'shadow-md hover:shadow-lg'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onLap(runner.id);
            }}
            disabled={!isRunning}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-normal opacity-90">{runner.name}</span>
              <span>LAP</span>
            </span>
          </Button>
          <Button 
            className={`col-span-1 font-display bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm h-14 text-xs px-0 ${
              theme === 'pop' ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.2)] rounded-xl border-2 border-secondary-foreground/20' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onFinish?.(runner.id);
            }}
            disabled={!isRunning}
            title="Finish Runner"
          >
            FIN
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
