/**
 * Agent Logger
 *
 * Creates pino child loggers with agent-specific context for structured,
 * filterable logging of all AI agent operations.
 */

import type { Logger } from 'pino';

import { logger } from '../../config/logger.js';

export interface LlmCallParams {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  purpose: string;
}

export interface AgentLogger extends Logger {
  logLlmCall(params: LlmCallParams): void;
}

export function createAgentLogger(agentName: string): AgentLogger {
  const child = logger.child({ agent: agentName }) as AgentLogger;

  child.logLlmCall = (params: LlmCallParams) => {
    child.info(
      {
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd: params.costUsd,
        durationMs: params.durationMs,
        purpose: params.purpose,
      },
      `[Agent:${agentName}] LLM call completed`
    );
  };

  return child;
}
