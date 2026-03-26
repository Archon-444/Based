/**
 * Load Testing Configuration
 *
 * Tests backend API under various load conditions to verify:
 * - Rate limiting effectiveness
 * - Response time under load
 * - Error handling
 * - Database connection pooling
 * - Concurrent request handling
 */

export const loadTestConfig = {
  // Test environments
  environments: {
    local: 'http://localhost:3000',
    staging: 'https://staging-api.based.app',
    production: 'https://api.based.app',
  },

  // Test scenarios
  scenarios: {
    // Scenario 1: Normal Load
    normalLoad: {
      name: 'Normal Load',
      duration: '5m',
      vus: 50, // 50 concurrent users
      description: 'Simulates typical production traffic',
    },

    // Scenario 2: Spike Test
    spike: {
      name: 'Spike Test',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 100 }, // Spike to 100 users
        { duration: '1m', target: 10 },
      ],
      description: 'Tests recovery from traffic spikes',
    },

    // Scenario 3: Stress Test
    stress: {
      name: 'Stress Test',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      description: 'Finds system breaking point',
    },

    // Scenario 4: Soak Test
    soak: {
      name: 'Soak Test',
      duration: '30m',
      vus: 50,
      description: 'Tests stability over extended period',
    },

    // Scenario 5: Rate Limit Test
    rateLimit: {
      name: 'Rate Limit Test',
      duration: '2m',
      vus: 1, // Single user
      iterations: 200, // Exceed rate limit
      description: 'Verifies rate limiting works correctly',
    },
  },

  // Thresholds (SLOs - Service Level Objectives)
  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500'],

    // 99% of requests should succeed
    http_req_failed: ['rate<0.01'],

    // No more than 100 errors per minute
    errors: ['count<100'],
  },

  // Test wallet addresses for authenticated requests
  testWallets: [
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    '0x2345678901234567890123456789012345678901234567890123456789012345',
    '0x3456789012345678901234567890123456789012345678901234567890123456',
  ],
};

export default loadTestConfig;
