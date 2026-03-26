import autocannon, { AutocannonResult } from 'autocannon';
import ora from 'ora';
import chalk from 'chalk';

import { createSummary, loadTestConfig } from './loadtest.config.js';

const spinner = ora('Starting suggestions load test').start();

const endpoints = {
  list: `${loadTestConfig.baseUrl}/api/suggestions`,
  create: `${loadTestConfig.baseUrl}/api/suggestions`,
};

const buildSuggestionPayload = (index: number) => ({
  question: `Will Based load test ${index} succeed?`,
  outcomes: ['Yes', 'No', 'Maybe'],
  category: 'load-testing',
  durationHours: 24,
  resolutionSource: 'https://api.prediction.example/load-testing',
});

const run = async () => {
  spinner.text = 'Warming up suggestion listing endpoint';

  const listResult = await autocannon({
    url: endpoints.list,
    connections: Math.max(10, Math.floor(loadTestConfig.connections / 2)),
    duration: loadTestConfig.durationSeconds,
    warmup: { duration: loadTestConfig.warmupSeconds },
    headers: loadTestConfig.headers,
  });

  spinner.succeed('Suggestion listing load test completed');
  printResult('GET /api/suggestions', listResult);

  spinner.start('Running suggestion submission load test');

  const fireResult = await autocannon({
    url: endpoints.create,
    method: 'POST',
    connections: loadTestConfig.connections,
    duration: loadTestConfig.durationSeconds,
    warmup: { duration: loadTestConfig.warmupSeconds },
    headers: {
      ...loadTestConfig.headers,
      'content-type': 'application/json',
    },
    setupClient: (client) => {
      let counter = 0;
      client.on('request', (_req, res) => {
        const payload = JSON.stringify(buildSuggestionPayload(counter++));
        client.setBody(payload);
        res.on('response', () => {
          // nothing to do
        });
      });
    },
  });

  spinner.succeed('Suggestion submission load test completed');
  printResult('POST /api/suggestions', fireResult);
};

const printResult = (label: string, result: AutocannonResult) => {
  const summary = createSummary(
    label,
    `Req/Sec: ${result.requests.average} (p99 ${result.requests.p99})\n` +
      `Latency: ${result.latency.average} ms (p99 ${result.latency.p99} ms)\n` +
      `2xx responses: ${result['2xx'] ?? 0}, 4xx responses: ${
        result['4xx'] ?? 0
      }, 5xx responses: ${result['5xx'] ?? 0}`,
  );

  console.log(chalk.cyan(summary));

  if ((result['429'] ?? 0) > 0) {
    console.log(
      chalk.yellow(
        `⚠️  Received ${result['429']} rate-limit responses. Adjust LOADTEST_CONNECTIONS or tweak express-rate-limit thresholds if this is unexpected.`,
      ),
    );
  }
};

run()
  .then(() => {
    console.log(chalk.green('\nSuggestions load testing completed successfully.'));
    process.exit(0);
  })
  .catch((error) => {
    spinner.fail('Suggestion load test failed');
    console.error(error);
    process.exit(1);
  });
