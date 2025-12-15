import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { secToClock } from "@/lib/timeUtils";
import { Runner } from "@/types";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  runners: Runner[];
}

import { useTheme } from "@/pages/Home";

export function SummaryModal({ isOpen, onClose, runners }: SummaryModalProps) {
  const { theme } = useTheme();
  // グラフ用データの作成
  // 各ランナーの平均ペースを比較
  const chartData = runners
    .filter(r => r.laps > 0)
    .map(r => {
      const totalPace = r.lapHistory.reduce((sum, lap) => sum + lap.lapPaceSecPerKm, 0);
      const avgPace = totalPace / r.laps;
      return {
        name: r.name,
        avgPace: avgPace, // 秒/km
        laps: r.laps
      };
    });

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 border border-border p-2 rounded shadow-lg backdrop-blur-sm">
          <p className="font-bold text-foreground">{label}</p>
          <p className="text-sm text-primary">
            Avg Pace: {secToClock(payload[0].value)} /km
          </p>
          <p className="text-xs text-muted-foreground">
            Total Laps: {payload[0].payload.laps}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = () => {
    // CSVヘッダー
    let csvContent = "Runner,Lap No,Lap Time,Pace (min/km),Diff (sec),Timestamp\n";

    // データ行の生成
    runners.forEach(runner => {
      runner.lapHistory.forEach((lap, index) => {
        const lapNo = index + 1;
        const lapTime = secToClock(lap.lapSec);
        const pace = secToClock(lap.lapPaceSecPerKm);
        const diff = lap.diffSecPerKm.toFixed(2); // 簡易的にkmあたりの差分を出力（必要に応じて周回差分に変更可）
        const timestamp = new Date(lap.timestamp).toISOString();
        
        csvContent += `"${runner.name}",${lapNo},${lapTime},${pace},${diff},${timestamp}\n`;
      });
    });

    // ダウンロードリンクの作成とクリック
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lap_data_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
        theme === 'cyberpunk' ? 'bg-background/95 backdrop-blur-md border-primary/20' : ''
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-display tracking-wider ${
            theme === 'cyberpunk' ? 'text-primary neon-text' :
            theme === 'pop' ? 'text-primary' :
            theme === 'colorful' ? 'text-primary' :
            ''
          }`}>
            {theme === 'cyberpunk' ? 'SESSION SUMMARY' : 'Session Summary'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* グラフエリア */}
          <div className={`h-[300px] w-full rounded-lg p-4 ${
            theme === 'cyberpunk' ? 'bg-black/20 border border-border/10' :
            theme === 'pop' ? 'bg-card border-2 border-border shadow-[4px_4px_0px_var(--border)]' :
            'bg-card border border-border'
          }`}>
            <h3 className="text-sm text-muted-foreground mb-2 uppercase tracking-widest">Average Pace Comparison</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <XAxis type="number" domain={['auto', 'auto']} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="avgPace" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                NO DATA AVAILABLE
              </div>
            )}
          </div>

          {/* 詳細テーブル */}
          <div className="space-y-4">
            <h3 className="text-sm text-muted-foreground uppercase tracking-widest">Detailed Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runners.map(runner => {
                if (runner.laps === 0) return null;
                
                const totalSec = runner.lapHistory.reduce((sum, lap) => sum + lap.lapSec, 0);
                const avgPace = runner.lapHistory.reduce((sum, lap) => sum + lap.lapPaceSecPerKm, 0) / runner.laps;
                const bestLap = Math.min(...runner.lapHistory.map(l => l.lapSec));

                return (
                  <div key={runner.id} className={`rounded p-3 ${
                    theme === 'cyberpunk' ? 'bg-card/50 border border-border/20' :
                    theme === 'pop' ? 'bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)]' :
                    'bg-card border border-border'
                  }`}>
                    <div className={`flex justify-between items-center mb-2 border-b pb-2 ${
                      theme === 'cyberpunk' ? 'border-border/10' : 'border-border'
                    }`}>
                      <span className="font-bold text-foreground">{runner.name}</span>
                      <span className={`text-xs ${
                        theme === 'cyberpunk' ? 'text-secondary neon-text-secondary' : 'text-secondary'
                      }`}>{runner.laps} LAPS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <div className="text-muted-foreground text-[10px]">TOTAL</div>
                        <div>{secToClock(totalSec)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px]">AVG PACE</div>
                        <div>{secToClock(avgPace)}/km</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px]">BEST LAP</div>
                        <div className="text-primary">{secToClock(bestLap)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleExportCSV} className={`gap-2 ${
            theme === 'pop' ? 'border-2 border-primary text-primary hover:bg-primary/10 shadow-[2px_2px_0px_var(--primary)] rounded-xl' : ''
          }`}>
            <Download className="w-4 h-4" />
            {theme === 'cyberpunk' ? 'EXPORT CSV' : 'Export CSV'}
          </Button>
          <Button variant="default" onClick={onClose} className={`${
            theme === 'pop' ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.1)] rounded-xl' : ''
          }`}>
            {theme === 'cyberpunk' ? 'CLOSE' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
