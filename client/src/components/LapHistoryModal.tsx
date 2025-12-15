import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { secToClock } from "@/lib/timeUtils";
import { Runner } from "@/types";
import { Timer, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LapHistoryModalProps {
  runner: Runner | null;
  isOpen: boolean;
  onClose: () => void;
}

import { useTheme } from "@/pages/Home";

export function LapHistoryModal({ runner, isOpen, onClose }: LapHistoryModalProps) {
  const { theme } = useTheme();
  if (!runner) return null;

  // Calculate average pace
  const avgPace = runner.lapHistory.length > 0
    ? runner.lapHistory.reduce((acc, lap) => acc + lap.lapPaceSecPerKm, 0) / runner.lapHistory.length
    : 0;

  // Prepare chart data
  const chartData = runner.lapHistory.map((lap, index) => ({
    lap: index + 1,
    pace: lap.lapPaceSecPerKm,
    target: runner.targetPaceMinPerKm * 60,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`text-foreground max-w-2xl max-h-[90vh] flex flex-col ${
        theme === 'cyberpunk' ? 'bg-black/90 border-primary/30' : ''
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-display flex items-center gap-2 ${
            theme === 'cyberpunk' ? 'text-primary neon-text' :
            theme === 'pop' ? 'text-primary' :
            theme === 'colorful' ? 'text-primary' :
            ''
          }`}>
            <Timer className="w-6 h-6" />
            {runner.name} - {theme === 'cyberpunk' ? 'Lap History' : 'History'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className={`p-3 rounded text-center ${
            theme === 'cyberpunk' ? 'bg-card/50 border border-border/30' :
            theme === 'pop' ? 'bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] rounded-xl' :
            'bg-card border border-border'
          }`}>
            <div className="text-xs text-muted-foreground uppercase mb-1">Total Laps</div>
            <div className="text-2xl font-mono font-bold text-primary">{runner.laps}</div>
          </div>
          <div className={`p-3 rounded text-center ${
            theme === 'cyberpunk' ? 'bg-card/50 border border-border/30' :
            theme === 'pop' ? 'bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] rounded-xl' :
            'bg-card border border-border'
          }`}>
            <div className="text-xs text-muted-foreground uppercase mb-1">Avg Pace</div>
            <div className="text-2xl font-mono font-bold text-secondary">
              {secToClock(avgPace)} <span className="text-xs text-muted-foreground">/km</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {runner.lapHistory.length > 1 && (
          <div className={`h-[200px] w-full mb-4 rounded p-2 ${
            theme === 'cyberpunk' ? 'bg-card/30 border border-border/30' :
            theme === 'pop' ? 'bg-card border-2 border-border rounded-xl' :
            'bg-card border border-border'
          }`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="lap" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={10}
                  tickFormatter={(val) => secToClock(val)}
                  domain={['auto', 'auto']}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  labelStyle={{ color: '#888' }}
                  formatter={(value: number) => [secToClock(value), 'Pace']}
                />
                <Line 
                  type="monotone" 
                  dataKey="pace" 
                  stroke="var(--primary)" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--primary)" }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="var(--muted-foreground)" 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={`flex-1 overflow-hidden border rounded-md ${
          theme === 'cyberpunk' ? 'border-border/30 bg-card/30' :
          theme === 'pop' ? 'border-2 border-border rounded-xl bg-card' :
          'border-border bg-card'
        }`}>
          <ScrollArea className="h-[200px]">
            <Table>
              <TableHeader className={`sticky top-0 ${
                theme === 'cyberpunk' ? 'bg-muted/50' : 'bg-muted'
              }`}>
                <TableRow className={`hover:bg-transparent ${
                  theme === 'cyberpunk' ? 'border-border/30' : 'border-border'
                }`}>
                  <TableHead className="w-[60px] text-center font-display text-xs">Lap</TableHead>
                  <TableHead className="text-center font-display text-xs">Time</TableHead>
                  <TableHead className="text-center font-display text-xs">Pace (/km)</TableHead>
                  <TableHead className="text-right font-display text-xs">Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runner.lapHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No laps recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  [...runner.lapHistory].reverse().map((lap, index) => {
                    const lapNumber = runner.lapHistory.length - index;
                    const isBest = false; // Logic for best lap could be added here
                    
                    // Calculate diff from target pace
                    const diff = lap.lapPaceSecPerKm - (runner.targetPaceMinPerKm * 60);
                    const diffColor = diff > 0 ? "text-destructive" : "text-primary";
                    const diffSign = diff > 0 ? "+" : "";

                    return (
                      <TableRow key={index} className={`hover:bg-primary/5 ${
                        theme === 'cyberpunk' ? 'border-border/30' : 'border-border'
                      }`}>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          #{lapNumber}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">
                          {secToClock(lap.lapSec)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {secToClock(lap.lapPaceSecPerKm)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${diffColor}`}>
                          {diffSign}{diff.toFixed(1)}s
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
