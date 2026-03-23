/**
 * Claude API Client
 *
 * Singleton wrapper around the Anthropic SDK with:
 * - Lazy SDK loading (never imports if ANTHROPIC_API_KEY is absent)
 * - Retry logic with exponential backoff on 429/500
 * - Per-agent cost tracking
 * - Structured output parsing via Zod
 * - Web search tool integration (web_search_20250305)
 */

import type { z } from 'zod';

import { env } from '../../config/env.js';
import { recordAgentCall, setAgentCost } from '../../monitoring/metrics.js';
import { createAgentLogger } from './agentLogger.js';

const log = createAgentLogger('claudeClient');

// ---------- Types ----------

interface AnthropicModule {
  default: new (opts: { apiKey: string }) => AnthropicClient;
}

interface AnthropicClient {
  messages: {
    create(params: Record<string, unknown>): Promise<AnthropicResponse>;
  };
}

interface AnthropicResponse {
  content: ContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
  model: string;
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'web_search_tool_result'; content: unknown };

export interface AgentCostRecord {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  callCount: number;
  lastCallAt: Date | null;
}

export interface ParsedResult<T> {
  parsed: T;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// ---------- Pricing (Claude Sonnet 4) ----------

const PRICING = {
  inputPerMTok: 3,
  outputPerMTok: 15,
};

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.inputPerMTok +
    (outputTokens / 1_000_000) * PRICING.outputPerMTok
  );
}

// ---------- Cost Tracking ----------

const agentCosts = new Map<string, AgentCostRecord>();

function getOrCreateCostRecord(agentName: string): AgentCostRecord {
  let record = agentCosts.get(agentName);
  if (!record) {
    record = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      callCount: 0,
      lastCallAt: null,
    };
    agentCosts.set(agentName, record);
  }
  return record;
}

function recordUsage(
  agentName: string,
  usage: { input_tokens: number; output_tokens: number }
): number {
  const cost = estimateCost(usage.input_tokens, usage.output_tokens);
  const record = getOrCreateCostRecord(agentName);
  record.totalInputTokens += usage.input_tokens;
  record.totalOutputTokens += usage.output_tokens;
  record.totalCostUsd += cost;
  record.callCount += 1;
  record.lastCallAt = new Date();
  setAgentCost(agentName, record.totalCostUsd);
  return cost;
}

export function getAgentCosts(): Map<string, AgentCostRecord> {
  return new Map(agentCosts);
}

export function getAgentCost(agentName: string): AgentCostRecord {
  return getOrCreateCostRecord(agentName);
}

// ---------- Singleton Client ----------

let _client: AnthropicClient | null = null;
let _initAttempted = false;

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_RETRIES = 3;

export async function getClaudeClient(): Promise<AnthropicClient | null> {
  if (_client) return _client;
  if (_initAttempted) return null;
  _initAttempted = true;

  if (!env.ANTHROPIC_API_KEY) {
    log.warn('[ClaudeClient] ANTHROPIC_API_KEY not set — agents disabled');
    return null;
  }

  try {
    const mod = (await import('@anthropic-ai/sdk')) as unknown as AnthropicModule;
    const Anthropic = mod.default;
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    log.info('[ClaudeClient] Anthropic SDK loaded successfully');
    return _client;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      '[ClaudeClient] Failed to load Anthropic SDK'
    );
    return null;
  }
}

// ---------- Retry Logic ----------

function isRetryable(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || status >= 500;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(
  client: AnthropicClient,
  params: Record<string, unknown>
): Promise<AnthropicResponse> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (error) {
      if (attempt === MAX_RETRIES || !isRetryable(error)) {
        throw error;
      }
      const delay = 1000 * Math.pow(2, attempt);
      log.warn({ attempt, delay }, '[ClaudeClient] Retrying after error');
      await sleep(delay);
    }
  }
  throw new Error('Unreachable');
}

// ---------- Structured Output (JSON → Zod) ----------

export async function callAndParse<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  agentName: string,
  model: string = DEFAULT_MODEL
): Promise<ParsedResult<T> | null> {
  const client = await getClaudeClient();
  if (!client) return null;

  const startMs = Date.now();

  try {
    const response = await callWithRetry(client, {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const costUsd = recordUsage(agentName, response.usage);
    recordAgentCall(agentName, 'success');

    const text = extractText(response.content);

    log.logLlmCall({
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd,
      durationMs: Date.now() - startMs,
      purpose: `${agentName}:structuredOutput`,
    });

    // Parse JSON from the response
    const jsonStr = extractJson(text);
    const parseResult = schema.safeParse(JSON.parse(jsonStr));

    if (parseResult.success) {
      return {
        parsed: parseResult.data,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        costUsd,
      };
    }

    // Retry once with validation error feedback
    log.warn(
      { errors: parseResult.error.flatten() },
      `[ClaudeClient] Zod validation failed for ${agentName}, retrying`
    );

    const retryResponse = await callWithRetry(client, {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text },
        {
          role: 'user',
          content: `Your response was not valid JSON matching the required schema. Errors: ${JSON.stringify(parseResult.error.flatten())}. Please try again with valid JSON only.`,
        },
      ],
    });

    const retryCost = recordUsage(agentName, retryResponse.usage);
    const retryText = extractText(retryResponse.content);
    const retryJson = extractJson(retryText);
    const retryParse = schema.safeParse(JSON.parse(retryJson));

    if (retryParse.success) {
      return {
        parsed: retryParse.data,
        inputTokens: response.usage.input_tokens + retryResponse.usage.input_tokens,
        outputTokens: response.usage.output_tokens + retryResponse.usage.output_tokens,
        costUsd: costUsd + retryCost,
      };
    }

    log.error(
      { errors: retryParse.error.flatten() },
      `[ClaudeClient] Zod validation failed on retry for ${agentName}`
    );
    recordAgentCall(agentName, 'failure');
    return null;
  } catch (error) {
    recordAgentCall(agentName, 'failure');
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startMs,
      },
      `[ClaudeClient] callAndParse failed for ${agentName}`
    );
    return null;
  }
}

// ---------- Web Search Call ----------

export async function callWithSearch(
  systemPrompt: string,
  userMessage: string,
  agentName: string,
  model: string = DEFAULT_MODEL
): Promise<{ text: string; inputTokens: number; outputTokens: number; costUsd: number } | null> {
  const client = await getClaudeClient();
  if (!client) return null;

  const startMs = Date.now();

  try {
    const response = await callWithRetry(client, {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
    });

    const costUsd = recordUsage(agentName, response.usage);
    recordAgentCall(agentName, 'success');

    const text = extractText(response.content);

    log.logLlmCall({
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd,
      durationMs: Date.now() - startMs,
      purpose: `${agentName}:webSearch`,
    });

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd,
    };
  } catch (error) {
    recordAgentCall(agentName, 'failure');
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startMs,
      },
      `[ClaudeClient] callWithSearch failed for ${agentName}`
    );
    return null;
  }
}

// ---------- Combined: Web Search + Structured Parse ----------

export async function searchAndParse<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  agentName: string,
  model: string = DEFAULT_MODEL
): Promise<ParsedResult<T> | null> {
  const client = await getClaudeClient();
  if (!client) return null;

  const startMs = Date.now();

  try {
    const response = await callWithRetry(client, {
      model,
      max_tokens: 4096,
      system:
        systemPrompt +
        '\n\nAfter completing your research, respond ONLY with a valid JSON object matching the required schema. No markdown, no explanation, no backticks.',
      messages: [{ role: 'user', content: userMessage }],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
    });

    const costUsd = recordUsage(agentName, response.usage);
    recordAgentCall(agentName, 'success');

    const text = extractText(response.content);

    log.logLlmCall({
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd,
      durationMs: Date.now() - startMs,
      purpose: `${agentName}:searchAndParse`,
    });

    const jsonStr = extractJson(text);
    const parseResult = schema.safeParse(JSON.parse(jsonStr));

    if (parseResult.success) {
      return {
        parsed: parseResult.data,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        costUsd,
      };
    }

    log.warn(
      { errors: parseResult.error.flatten() },
      `[ClaudeClient] Zod validation failed for ${agentName} (searchAndParse)`
    );

    // Retry without search (just fix the JSON)
    const retryResponse = await callWithRetry(client, {
      model,
      max_tokens: 4096,
      system:
        systemPrompt +
        '\n\nRespond ONLY with a valid JSON object. No markdown, no explanation, no backticks.',
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text },
        {
          role: 'user',
          content: `Your response was not valid JSON matching the required schema. Errors: ${JSON.stringify(parseResult.error.flatten())}. Please output ONLY the corrected JSON object.`,
        },
      ],
    });

    const retryCost = recordUsage(agentName, retryResponse.usage);
    const retryText = extractText(retryResponse.content);
    const retryJson = extractJson(retryText);
    const retryParse = schema.safeParse(JSON.parse(retryJson));

    if (retryParse.success) {
      return {
        parsed: retryParse.data,
        inputTokens: response.usage.input_tokens + retryResponse.usage.input_tokens,
        outputTokens: response.usage.output_tokens + retryResponse.usage.output_tokens,
        costUsd: costUsd + retryCost,
      };
    }

    log.error(
      { errors: retryParse.error.flatten() },
      `[ClaudeClient] searchAndParse retry failed for ${agentName}`
    );
    recordAgentCall(agentName, 'failure');
    return null;
  } catch (error) {
    recordAgentCall(agentName, 'failure');
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startMs,
      },
      `[ClaudeClient] searchAndParse failed for ${agentName}`
    );
    return null;
  }
}

// ---------- Helpers ----------

function extractText(content: ContentBlock[]): string {
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

function extractJson(text: string): string {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  // Try to find a JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    return jsonMatch[0];
  }

  // Return as-is and let JSON.parse fail with a clear error
  return text;
}
