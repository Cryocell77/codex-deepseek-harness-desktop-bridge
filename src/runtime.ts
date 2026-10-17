export interface RunResult {
  text: string;
  outcome: 'completed' | 'failed' | 'cancelled';
  truncated: boolean;
  error?: { code: string; message: string };
}
export interface RuntimeSession {
  id: string;
  run(prompt: string): Promise<RunResult>;
  cancel(): void;
  dispose(): Promise<void>;
}
export interface DesktopRuntime {
  create(cwd: string, preset: string): Promise<RuntimeSession>;
}
