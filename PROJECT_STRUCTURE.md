# DropDebt CDK Project Structure

## Directory Layout

```
dropdebt/
├── bin/                           # CDK app entry point
│   └── dropdebt.ts
├── lib/                           # CDK infrastructure code
│   ├── stacks/
│   │   ├── database-stack.ts      # DynamoDB table
│   │   ├── compute-stack.ts       # Lambda functions
│   │   ├── api-stack.ts           # API Gateway
│   │   └── monitoring-stack.ts    # CloudWatch, alarms
│   ├── constructs/
│   │   ├── lambda-function.ts     # Reusable Lambda construct
│   │   └── api-lambda.ts          # API-specific Lambda construct
│   └── dropdebt-stack.ts          # Main stack orchestrator
├── src/                           # Application code (Lambda functions)
│   ├── shared/                    # Shared utilities and types
│   │   ├── types/
│   │   │   ├── user.ts           # User data models
│   │   │   ├── bill.ts           # Bill data models
│   │   │   ├── expense.ts        # Expense data models
│   │   │   ├── payment.ts        # Payment arrangement models
│   │   │   ├── api.ts            # API request/response types
│   │   │   └── index.ts          # Type exports
│   │   ├── utils/
│   │   │   ├── dynamodb.ts       # DynamoDB helpers
│   │   │   ├── response.ts       # API response formatting
│   │   │   ├── validation.ts     # Input validation
│   │   │   ├── errors.ts         # Error handling
│   │   │   └── index.ts          # Utility exports
│   │   └── constants/
│   │       ├── entity-types.ts   # DynamoDB entity constants
│   │       ├── priority-scores.ts # Priority calculation constants
│   │       └── index.ts          # Constants exports
│   ├── functions/                 # Lambda function implementations
│   │   ├── bill-prioritization/
│   │   │   ├── handler.ts        # Main handler
│   │   │   ├── calculator.ts     # Priority calculation logic
│   │   │   └── index.ts          # Function exports
│   │   ├── payment-splitting/
│   │   │   ├── handler.ts        # Main handler
│   │   │   ├── splitter.ts       # Payment splitting logic
│   │   │   └── index.ts          # Function exports
│   │   ├── essential-protection/
│   │   │   ├── handler.ts        # Main handler
│   │   │   ├── analyzer.ts       # Essential needs analysis
│   │   │   └── index.ts          # Function exports
│   │   ├── budget-analysis/
│   │   │   ├── handler.ts        # Main handler
│   │   │   ├── analyzer.ts       # Budget analysis logic
│   │   │   └── index.ts          # Function exports
│   │   └── api/                  # API endpoint handlers
│   │       ├── users/
│   │       │   ├── get-profile.ts
│   │       │   ├── update-profile.ts
│   │       │   └── index.ts
│   │       ├── bills/
│   │       │   ├── list-bills.ts
│   │       │   ├── create-bill.ts
│   │       │   ├── update-bill.ts
│   │       │   └── index.ts
│   │       └── payments/
│   │           ├── create-arrangement.ts
│   │           ├── update-arrangement.ts
│   │           └── index.ts
├── test/                          # Test files
│   ├── unit/
│   │   ├── functions/
│   │   └── utils/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
├── jest.config.js
└── cdk.json
```

## Key Benefits

1. **Clear Separation**: Infrastructure (lib/) vs Application (src/) code
2. **Shared Code**: Common types and utilities prevent duplication
3. **Modular Functions**: Each Lambda function has its own directory
4. **Testability**: Organized test structure for unit and integration tests
5. **TypeScript Path Resolution**: Easy imports between directories
6. **Rapid Development**: Reusable constructs speed up Lambda creation

## Import Examples

```typescript
// From Lambda function
import { User, Bill } from '../../shared/types';
import { DynamoDbService, ApiResponse } from '../../shared/utils';

// From CDK stack
import { LambdaFunction } from '../constructs/lambda-function';
import { DatabaseStack } from './database-stack';
```