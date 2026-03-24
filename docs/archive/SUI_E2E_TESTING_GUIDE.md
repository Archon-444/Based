# Sui End-to-End Testing Guide

This guide covers comprehensive end-to-end testing for Sui betting and settlement flows in the Move Market prediction platform.

## Overview

The Sui E2E testing suite ensures that all critical user journeys work correctly across the Sui blockchain integration, including:

- Market discovery and display
- Market creation
- Betting flows
- Settlement and claiming
- Wallet integration
- Chain switching
- Error handling
- Performance validation

## Test Structure

### Test Categories

1. **Market Discovery and Display** (`sui-e2e`)
   - Sui markets appear correctly on markets page
   - Market details display properly
   - Chain indicators show correctly

2. **Market Creation Flow** (`sui-creation`)
   - Create market form works with Sui
   - Market creation transactions succeed
   - Market appears in list after creation

3. **Betting Flow** (`sui-betting`)
   - Place bets on Sui markets
   - Handle betting errors gracefully
   - Show proper loading states

4. **Settlement Flow** (`sui-settlement`)
   - Request settlement for resolved markets
   - Claim winnings successfully
   - Handle settlement errors

5. **Wallet Integration** (`sui-wallet`)
   - Connect Sui wallets
   - Display balances correctly
   - Handle wallet disconnection

6. **Chain Switching** (`sui-chain-switching`)
   - Switch between Aptos and Sui
   - Maintain state across switches
   - Show appropriate UI for each chain

7. **Error Handling** (`sui-error-handling`)
   - Network errors
   - Invalid data
   - Transaction failures

8. **Performance** (`sui-performance`)
   - Loading states
   - Response times
   - Memory usage

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Set up test environment
export NODE_ENV=test
export VITE_SUI_PACKAGE_ID=0xtest123
export VITE_SUI_ROLE_REGISTRY_ID=0xrole123
export VITE_SUI_ORACLE_REGISTRY_ID=0xoracle123
```

### Quick Start

```bash
# Run all Sui E2E tests
./scripts/run-sui-e2e-tests.sh

# Run specific test category
npm test -- --testNamePattern="sui-betting"

# Run with coverage
npm test -- --coverage --testNamePattern="sui-e2e"

# Run in watch mode
npm test -- --watch --testNamePattern="sui-e2e"
```

### Test Configuration

The test suite uses the following configuration:

- **Test Timeout**: 30 seconds per test
- **Coverage Threshold**: 80%
- **Mock Data**: Predefined test markets and transactions
- **Environment**: Isolated test environment

## Test Data

### Mock Markets

```typescript
const mockSuiMarket = {
  id: '1',
  onChainId: '123',
  chain: 'sui',
  question: 'Will Sui reach $10 by end of 2024?',
  outcomes: ['Yes', 'No'],
  status: 'active',
  outcomePools: [1500000n, 2500000n],
  totalVolume: 4000000n,
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  liquidityParam: 1000000n,
  suiMarketObjectId: '0xmarket123',
  suiShardObjectIds: ['0xshard0', '0xshard1'],
  suiQueueObjectId: '0xqueue123',
};
```

### Mock Wallet

```typescript
const mockSuiWallet = {
  connected: true,
  account: {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    publicKey: 'mock-public-key',
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
  signAndExecuteTransactionBlock: vi.fn(),
  signMessage: vi.fn(),
};
```

## Test Scenarios

### 1. Market Discovery

**Test**: `should display Sui markets on markets page`

**Steps**:
1. Navigate to markets page
2. Verify Sui markets are displayed
3. Check chain indicators
4. Verify market data is correct

**Expected Result**: Sui markets appear with proper formatting and chain indicators

### 2. Market Creation

**Test**: `should create Sui market successfully`

**Steps**:
1. Navigate to create market page
2. Fill out market form
3. Submit market creation
4. Verify transaction success
5. Check market appears in list

**Expected Result**: Market is created and appears in markets list

### 3. Betting Flow

**Test**: `should place bet on Sui market successfully`

**Steps**:
1. Navigate to market detail page
2. Select outcome (Yes/No)
3. Enter bet amount
4. Click place bet
5. Verify transaction success

**Expected Result**: Bet is placed successfully and reflected in UI

### 4. Settlement Flow

**Test**: `should request settlement for Sui market successfully`

**Steps**:
1. Navigate to resolved market
2. Click claim winnings
3. Verify transaction success
4. Check balance update

**Expected Result**: Settlement is requested and winnings are claimed

### 5. Error Handling

**Test**: `should handle betting errors gracefully`

**Steps**:
1. Attempt to place bet with insufficient funds
2. Verify error message is displayed
3. Check UI state is reset

**Expected Result**: Error is handled gracefully with user-friendly message

## Mocking Strategy

### API Responses

```typescript
const mockApiResponses = {
  '/api/markets': {
    success: true,
    data: [mockSuiMarket],
  },
  '/api/markets/1': {
    success: true,
    data: mockSuiMarket,
  },
  '/api/markets/sui-objects/1': {
    success: true,
    data: {
      marketObjectId: '0xmarket123',
      shardObjectIds: ['0xshard0', '0xshard1'],
      queueObjectId: '0xqueue123',
    },
  },
};
```

### Wallet Mocking

```typescript
// Mock Sui wallet in window
Object.defineProperty(window, 'suiWallet', {
  value: mockSuiWallet,
  writable: true,
});
```

### SDK Mocking

```typescript
const mockSDK = {
  getModuleAddress: vi.fn(() => '0xpackage123'),
  toMicroUSDC: vi.fn((amount: number) => amount * 1000000),
  getRoleRegistryId: vi.fn(() => '0xrole123'),
  getOracleRegistryId: vi.fn(() => '0xoracle123'),
};
```

## Coverage Requirements

The test suite aims for:

- **80%+ code coverage** for Sui-related components
- **100% coverage** of critical user flows
- **90%+ coverage** of error handling paths

### Coverage Commands

```bash
# Generate coverage report
npm test -- --coverage --testNamePattern="sui-e2e"

# View coverage in browser
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

## Continuous Integration

### GitHub Actions

```yaml
name: Sui E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: ./scripts/run-sui-e2e-tests.sh
```

### Pre-commit Hooks

```bash
# Install pre-commit hook
npm install --save-dev husky
npx husky add .husky/pre-commit "npm test -- --testNamePattern='sui-e2e' --passWithNoTests"
```

## Debugging Tests

### Common Issues

1. **Timeout Errors**
   - Increase test timeout
   - Check for infinite loops
   - Verify async operations complete

2. **Mock Failures**
   - Verify mock setup
   - Check mock return values
   - Ensure mocks are restored

3. **Environment Issues**
   - Check environment variables
   - Verify test database setup
   - Clear test cache

### Debug Commands

```bash
# Run single test with verbose output
npm test -- --testNamePattern="should place bet" --verbose

# Run with debug logging
DEBUG=* npm test -- --testNamePattern="sui-e2e"

# Run with coverage and debug
npm test -- --coverage --testNamePattern="sui-e2e" --verbose
```

## Test Maintenance

### Adding New Tests

1. Create test file in `src/__tests__/`
2. Follow naming convention: `sui-{category}.test.tsx`
3. Add test category to runner script
4. Update documentation

### Updating Mocks

1. Update mock data in test files
2. Verify mock responses match API
3. Update test expectations
4. Run tests to verify

### Performance Monitoring

1. Monitor test execution time
2. Track memory usage
3. Identify slow tests
4. Optimize as needed

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Restore mocks after each test
3. **Clarity**: Use descriptive test names
4. **Coverage**: Aim for high coverage
5. **Performance**: Keep tests fast
6. **Maintainability**: Keep tests simple and readable

## Troubleshooting

### Test Failures

1. Check test output for specific errors
2. Verify mock data is correct
3. Check environment variables
4. Clear test cache: `npm test -- --clearCache`

### Environment Issues

1. Verify Node.js version (18+)
2. Check npm version
3. Clear node_modules and reinstall
4. Check system dependencies

### CI/CD Issues

1. Check GitHub Actions logs
2. Verify environment variables in CI
3. Check test timeout settings
4. Verify test database setup

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Sui Documentation](https://docs.sui.io/)
- [Move Market API Documentation](./docs/API.md)
