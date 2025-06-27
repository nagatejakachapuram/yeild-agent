import { main } from "./agent";

export interface ScheduleConfig {
  intervalMinutes: number;
  startImmediately?: boolean;
  maxRuns?: number;
  onRunComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export class YieldScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private runCount = 0;
  private config: ScheduleConfig;
  private isRunning = false;

  constructor(config: ScheduleConfig) {
    this.config = {
      startImmediately: true,
      maxRuns: -1, // -1 means unlimited
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting yield scheduler with ${this.config.intervalMinutes} minute intervals`);

    if (this.config.startImmediately) {
      await this.runStrategy();
    }

    this.intervalId = setInterval(async () => {
      await this.runStrategy();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("⏹️ Scheduler stopped");
  }

  private async runStrategy(): Promise<void> {
    if (this.config.maxRuns !== -1 && this.runCount >= this.config.maxRuns) {
      console.log(`✅ Reached maximum runs (${this.config.maxRuns}), stopping scheduler`);
      this.stop();
      return;
    }

    this.runCount++;
    const startTime = new Date();
    
    try {
      console.log(`\n🔄 Run #${this.runCount} - ${startTime.toLocaleString()}`);
      console.log("🔁 Running yield strategy selection...");

      const lowRiskResult = await main("low");
      const highRiskResult = await main("high");

      const results = {
        runNumber: this.runCount,
        timestamp: startTime.toISOString(),
        lowRisk: lowRiskResult,
        highRisk: highRiskResult
      };

      console.log("✅ Strategy selection complete.");
      
      if (this.config.onRunComplete) {
        this.config.onRunComplete(results);
      }

    } catch (error) {
      console.error(`❌ Error in run #${this.runCount}:`, error);
      
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  getStatus(): { isRunning: boolean; runCount: number; nextRun?: Date } {
    const status: any = {
      isRunning: this.isRunning,
      runCount: this.runCount
    };

    if (this.isRunning && this.intervalId) {
      // Calculate next run time (approximate)
      const nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + this.config.intervalMinutes);
      status.nextRun = nextRun;
    }

    return status;
  }
}

// Utility function to parse schedule from command line arguments
export function parseScheduleFromArgs(): ScheduleConfig {
  const args = process.argv.slice(2);
  const config: ScheduleConfig = {
    intervalMinutes: 60 // default 1 hour
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--interval':
      case '-i':
        const interval = parseInt(args[i + 1]);
        if (!isNaN(interval) && interval > 0) {
          config.intervalMinutes = interval;
        }
        i++;
        break;
      
      case '--no-start-immediate':
        config.startImmediately = false;
        break;
      
      case '--max-runs':
      case '-m':
        const maxRuns = parseInt(args[i + 1]);
        if (!isNaN(maxRuns) && maxRuns > 0) {
          config.maxRuns = maxRuns;
        }
        i++;
        break;
      
      case '--help':
      case '-h':
        console.log(`
Yield Agent Scheduler Usage:
  node dist/index.js [options]

Options:
  -i, --interval <minutes>     Set interval between runs (default: 60)
  --no-start-immediate         Don't run immediately on start
  -m, --max-runs <number>      Maximum number of runs before stopping
  -h, --help                   Show this help message

Examples:
  node dist/index.js                    # Run every 60 minutes
  node dist/index.js -i 30              # Run every 30 minutes
  node dist/index.js -i 15 -m 10        # Run every 15 minutes, max 10 times
  node dist/index.js --no-start-immediate -i 120  # Run every 2 hours, don't start immediately
        `);
        process.exit(0);
        break;
    }
  }

  return config;
} 