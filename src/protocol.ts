import { z } from 'zod';
export const VERSION = 1;
export const id = z.string().uuid();
export const operations = {
  connection_info: z.object({}).strict(),
  create_session: z
    .object({
      preset: z.string().min(1).max(128).optional(),
      repository: z.string().min(1).max(4096).optional(),
      ref: z.string().min(1).max(200).optional(),
    })
    .strict(),
  list_sessions: z.object({}).strict(),
  close_session: z.object({ sessionId: id }).strict(),
  submit_task: z
    .object({ sessionId: id, prompt: z.string().min(1).max(65536), requestId: id })
    .strict(),
  get_task: z.object({ taskId: id }).strict(),
  get_result: z.object({ taskId: id }).strict(),
  cancel_task: z.object({ taskId: id }).strict(),
  forget_task: z.object({ taskId: id }).strict(),
} as const;
export type Operation = keyof typeof operations;
export const envelope = z
  .object({
    version: z.literal(VERSION),
    operation: z.enum(Object.keys(operations) as [Operation, ...Operation[]]),
    params: z.unknown(),
  })
  .strict();
export const taskState = z.enum([
  'running',
  'cancelling',
  'completed',
  'failed',
  'cancelled',
  'timed_out',
]);
export type TaskState = z.infer<typeof taskState>;
export const terminal = (state: TaskState): boolean => !['running', 'cancelling'].includes(state);
export interface TaskView {
  taskId: string;
  sessionId: string;
  state: TaskState;
  createdAt: string;
  finishedAt?: string;
  error?: { code: string; message: string };
  truncated: boolean;
}
export interface SessionView {
  sessionId: string;
  runtimeSessionId: string;
  cwd: string;
  preset: string;
  activeTaskId?: string;
}
