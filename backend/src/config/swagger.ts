import path from 'node:path';
import { fileURLToPath } from 'node:url';

import swaggerJsdoc, { type Options } from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = await import(path.join(__dirname, '../../package.json'), {
  assert: { type: 'json' },
});

const swaggerOptions: Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Move Market API',
      version: packageJson.default.version ?? '0.1.0',
      description:
        'REST API for the Move Market backend. Authentication is performed via wallet signature headers (see security scheme).',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        WalletSignatureAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-wallet-address',
          description:
            'Requests must include the wallet signature headers: x-wallet-address, x-wallet-public-key, x-wallet-signature, x-wallet-message, x-wallet-timestamp, x-wallet-nonce.',
        },
      },
      schemas: {
        SuggestionStatus: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected', 'published'],
        },
        Suggestion: {
          type: 'object',
          required: ['id', 'question', 'outcomes', 'durationHours', 'status'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            question: { type: 'string' },
            category: { type: 'string', nullable: true },
            outcomes: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
            },
            durationHours: { type: 'integer', minimum: 1 },
            resolutionSource: { type: 'string', nullable: true },
            proposer: { type: 'string' },
            reviewer: { type: 'string', nullable: true },
            reviewReason: { type: 'string', nullable: true },
            status: { $ref: '#/components/schemas/SuggestionStatus' },
            chain: { type: 'string', enum: ['aptos', 'sui', 'movement', 'base'] },
            upvotes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            approvedAt: { type: 'string', format: 'date-time', nullable: true },
            publishedMarketId: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            retryAfter: { type: 'integer', nullable: true },
          },
        },
      },
    },
    security: [{ WalletSignatureAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../controllers/*.ts')],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
