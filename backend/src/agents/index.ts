/**
 * Agent Manager
 *
 * Orchestrates AI agent startup/shutdown and provides cost reporting.
 * All agents are optional — controlled by independent env flags.
 */

import type { ScheduledTask } from 'node-cron';

import { env } from '../config/env.js';
import { createAgentLogger } from './shared/agentLogger.js';
import { getAgentCosts, getClaudeClient, type AgentCostRecord } from './shared/claudeClient.js';

const log = createAgentLogger('manager');

export class AgentManager {
  private commentaryCron: ScheduledTask | null = null;

  async start(): Promise<void> {
    if (env.AGENT_ENABLED !== 'true') {
      log.info('[AgentManager] Agents disabled (AGENT_ENABLED != true)');
      return;
    }

    if (!env.ANTHROPIC_API_KEY) {
      log.warn('[AgentManager] AGENT_ENABLED but ANTHROPIC_API_KEY missing — agents disabled');
      return;
    }

    // Verify SDK can load
    const client = await getClaudeClient();
    if (!client) {
      log.error('[AgentManager] Failed to initialize Claude client — agents disabled');
      return;
    }

    // Start commentary cron if enabled
    if (env.AGENT_COMMENTARY_ENABLED === 'true') {
      try {
        const { startCommentaryCron } = await import('./commentaryAgent.js');
        this.commentaryCron = startCommentaryCron();
      } catch (error) {
        log.error(
          { error: error instanceof Error ? error.message : String(error) },
          '[AgentManager] Failed to start commentary cron'
        );
      }
    }

    log.info(
      {
        autoResolve: env.AGENT_AUTO_RESOLVE === 'true',
        autoDispute: env.AGENT_AUTO_DISPUTE === 'true',
        commentary: env.AGENT_COMMENTARY_ENABLED === 'true',
        confidenceThreshold: env.AGENT_CONFIDENCE_THRESHOLD,
        disputeConfidenceThreshold: env.AGENT_DISPUTE_CONFIDENCE_THRESHOLD,
      },
      '[AgentManager] Agents started'
    );
  }

  stop(): void {
    if (this.commentaryCron) {
      this.commentaryCron.stop();
      this.commentaryCron = null;
      log.info('[AgentManager] Commentary cron stopped');
    }

    log.info('[AgentManager] Agents stopped');
  }

  getCostReport(): Record<string, AgentCostRecord> {
    const costs = getAgentCosts();
    const report: Record<string, AgentCostRecord> = {};
    for (const [agent, record] of costs) {
      report[agent] = record;
    }
    return report;
  }
}
