# Testing Setup Guide for DropDebt Frontend Components

## Overview

This directory contains comprehensive unit tests for all React components in the DropDebt dashboard. The tests are designed to ensure components work correctly under all scenarios, including edge cases important for users in financial crisis situations.

## Prerequisites

To run these tests, you'll need to install the following testing dependencies:

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  @types/jest \
  jest-environment-jsdom
```

## Test Configuration

### 1. Add Jest Configuration

Create `jest.config.js` in the frontend root:

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 2. Setup Test Environment

Create `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock window.open for crisis hotline tests
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

// Mock environment variables
process.env.VITE_MOCK_API = 'true';

// Mock Intersection Observer for loading animations
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));
```

### 3. Update Package.json Scripts

Add testing scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Component
```bash
npm test NextActionCard
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

Each component test file follows this structure:

1. **Imports and Setup** - Mock data and utility functions
2. **Rendering Tests** - Basic component rendering with different props
3. **Interaction Tests** - User interactions and event handlers
4. **Accessibility Tests** - ARIA labels, keyboard navigation, screen readers
5. **Crisis Features** - Emergency functionality specific to financial stress
6. **Edge Cases** - Error states, empty data, extreme values

## Crisis-Focused Testing Considerations

### 1. Emergency Resource Testing
- All crisis hotline links (2-1-1, 988) must work
- Emergency buttons must be large enough (44px minimum)
- Crisis styling must have proper contrast ratios

### 2. Accessibility Priority
- Screen reader compatibility is critical
- Keyboard navigation must work completely
- High contrast mode support
- Clear focus indicators

### 3. Stress-Appropriate UX
- No aggressive animations during loading
- Clear, non-technical error messages
- Gentle color schemes for different financial statuses
- Touch-friendly interface elements

### 4. Data Validation
- Handle missing or malformed API data gracefully
- Show meaningful messages for empty states
- Validate currency formatting edge cases

## Mock Data Standards

All test files use consistent mock data that represents realistic financial scenarios:

- **Typical User**: Mixed payment statuses, some overdue bills
- **Crisis User**: Overdue bills, negative available funds
- **Stable User**: All bills current, positive available funds

## Coverage Requirements

- **Minimum 80%** coverage for all metrics
- **100% coverage** for crisis/emergency features
- **All user interactions** must be tested
- **All accessibility features** must be verified

## Continuous Integration

Tests are designed to run in CI environments:

```bash
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage reports
- Exits with proper status codes for CI/CD

## Common Test Patterns

### Testing Click Handlers
```typescript
const mockHandler = jest.fn();
fireEvent.click(screen.getByRole('button'));
expect(mockHandler).toHaveBeenCalled();
```

### Testing Crisis Features
```typescript
const mockOpen = jest.fn();
window.open = mockOpen;
fireEvent.click(screen.getByText('Call 2-1-1'));
expect(mockOpen).toHaveBeenCalledWith('tel:211', '_self');
```

### Testing Accessibility
```typescript
expect(screen.getByLabelText(/emergency assistance/i)).toBeInTheDocument();
expect(button).toHaveClass('touch-target');
```

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure `@/` alias is configured in both Jest and TypeScript
2. **CSS Classes**: Tailwind classes in tests require proper Jest configuration
3. **Window.open Mocking**: Required for crisis hotline functionality
4. **Async Operations**: Use proper async/await patterns for API calls

### Debug Tips

```typescript
// See rendered HTML
screen.debug();

// Check for specific elements
screen.logTestingPlaygroundURL();

// Verbose test output
npm test -- --verbose
```

## Best Practices

1. **Test Behavior, Not Implementation** - Focus on what users experience
2. **Use Semantic Queries** - Prefer `getByRole`, `getByLabelText`
3. **Test Crisis Paths First** - Emergency features are highest priority
4. **Mock External Dependencies** - API calls, window.open, etc.
5. **Keep Tests Readable** - Clear test names and good organization

## Contributing

When adding new components or features:

1. Write tests first (TDD approach preferred)
2. Ensure crisis/accessibility features are tested
3. Add edge cases and error scenarios
4. Update mock data if needed
5. Maintain coverage thresholds

This testing setup ensures that the DropDebt dashboard remains reliable and accessible for users in financial crisis situations.