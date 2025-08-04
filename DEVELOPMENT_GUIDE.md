# DropDebt Development Guide

## Project Overview

DropDebt is a smart bill payment scheduling system built with AWS CDK and TypeScript. The system helps users prioritize bills, split payments optimally, protect essential expenses, and analyze spending patterns.

## Architecture

### Core Features
1. **Bill Prioritization** - Calculate priority scores and rank bills for optimal payment order
2. **Payment Splitting** - Split available funds across multiple bills using various strategies
3. **Essential Needs Protection** - Analyze and protect critical expenses from overspending
4. **Budget Analysis** - Provide spending insights and recommendations

### Technology Stack
- **Infrastructure**: AWS CDK (TypeScript)
- **Compute**: AWS Lambda (Node.js 18.x)
- **Database**: DynamoDB (Single-table design)
- **Language**: TypeScript
- **Testing**: Jest

## Project Structure

```
dropdebt/
├── bin/                    # CDK app entry point
├── lib/                    # CDK infrastructure code
│   ├── stacks/            # CDK stack definitions
│   │   ├── database-stack.ts
│   │   └── compute-stack.ts
│   ├── constructs/        # Reusable CDK constructs
│   │   ├── lambda-function.ts
│   │   └── api-lambda.ts
│   └── dropdebt-stack.ts  # Main stack orchestrator
├── src/                   # Application code
│   ├── shared/           # Shared utilities and types
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── constants/    # Application constants
│   └── functions/        # Lambda function implementations
│       ├── bill-prioritization/
│       ├── payment-splitting/
│       ├── essential-protection/
│       └── budget-analysis/
├── test/                 # Test files and fixtures
└── docs/                # Documentation
```

## Development Workflow

### Prerequisites
- AWS CLI configured
- Node.js 18.x or later
- AWS CDK CLI installed globally

### Setup
```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
npm run bootstrap

# Build the project
npm run build
```

### Development Commands
```bash
# Watch mode for development
npm run watch

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Lint TypeScript
npm run lint

# Clean compiled files
npm run clean
```

### Deployment Commands
```bash
# Deploy all stacks
npm run deploy

# Deploy specific stacks
npm run deploy:database
npm run deploy:compute

# View deployment diff
npm run diff

# Synthesize CloudFormation
npm run synth

# Destroy all resources
npm run destroy
```

### Testing Lambda Functions
```bash
# Test bill prioritization
npm run invoke:bill-prioritization

# Test payment splitting
npm run invoke:payment-splitting
```

## Core Business Logic

### Bill Prioritization Algorithm

The priority calculation considers multiple factors:

```typescript
Priority Score = Base Score + Due Date Modifier + Essential Modifier + Late Fee Modifier + Interest Modifier
```

**Base Scores by Category:**
- Housing: 95 (rent, mortgage)
- Utilities: 90 (electric, gas, water)
- Debt: 85 (credit cards, loans)
- Insurance: 80 (health, auto)
- Healthcare: 85 (medical bills)
- Transportation: 75 (car payments)

**Modifiers:**
- Due Date: +15 (overdue) to +0 (future)
- Essential: +10 (essential bills)
- Late Fee: +8 (high fee) to +0 (no fee)
- Interest: +6 (high rate) to +0 (no interest)

### Payment Splitting Strategies

1. **Priority First**: Pay highest priority bills first
2. **Equal Split**: Divide funds equally among bills
3. **Minimum First**: Pay minimum amounts, then allocate remaining by priority
4. **Avalanche**: Pay highest interest rates first
5. **Snowball**: Pay smallest balances first

## Database Design

### Single-Table DynamoDB Design

**Main Table**: `dropdebt-data`
- **PK**: Partition Key (USER#userId, etc.)
- **SK**: Sort Key (PROFILE, BILL#billId, etc.)
- **GSI1**: Global Secondary Index for cross-entity queries

**Access Patterns:**
- Get user profile: `PK = USER#userId, SK = PROFILE`
- Get bills by priority: `GSI1PK = BILLS_BY_PRIORITY#userId`
- Get essential expenses: `GSI1PK = EXPENSES_BY_TYPE#userId, SK begins_with ESSENTIAL`

## API Design

### Core Endpoints

**Bill Prioritization**
```
POST /users/{userId}/prioritization
```

**Payment Splitting**
```
POST /users/{userId}/payment-splitting
```

**Essential Protection**
```
POST /users/{userId}/essential-protection
```

**Budget Analysis**
```
POST /users/{userId}/budget-analysis
```

## Shared Utilities

### DynamoDB Service
```typescript
import { DynamoDbService } from '@shared/utils';

const db = new DynamoDbService();
const user = await db.getUser(userId);
const bills = await db.getBillsByPriority(userId);
```

### Response Builder
```typescript
import { ResponseBuilder } from '@shared/utils';

return ResponseBuilder.success(data);
return ResponseBuilder.error('Error message', 400);
return ResponseBuilder.validationError('Invalid input');
```

### Validation
```typescript
import { validateBill, validateUser } from '@shared/utils';

const validation = validateBill(billData);
if (!validation.isValid) {
  return ResponseBuilder.validationError(validation.errors[0].message);
}
```

## Testing Strategy

### Unit Tests
- Test individual functions and classes
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test Lambda function handlers
- Test DynamoDB interactions
- Use real AWS services in test environment

### Test Structure
```
test/
├── unit/
│   ├── functions/        # Lambda function tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
└── fixtures/           # Test data and payloads
```

## Monitoring and Observability

### CloudWatch Metrics
- Lambda duration, errors, throttles
- DynamoDB read/write capacity
- Custom business metrics

### Alarms
- Function error rate > 5%
- Function duration > 80% of timeout
- Any throttling events

### Logging
- Structured JSON logging
- Request/response correlation IDs
- Performance metrics

## Environment Configuration

### Environment Variables
- `DYNAMODB_TABLE_NAME`: DynamoDB table name
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level
- `FEATURE_NAME`: Lambda function feature identifier

### Configuration per Environment
- Development: Lower memory, shorter retention
- Production: Higher memory, longer retention, point-in-time recovery

## Security Considerations

### IAM Permissions
- Least privilege access
- Function-specific roles
- No overly broad permissions

### Data Protection
- Encryption at rest (DynamoDB)
- Encryption in transit (HTTPS)
- Input validation and sanitization

### Error Handling
- Don't expose internal details
- Log sensitive information securely
- Graceful degradation

## Performance Optimization

### Lambda Functions
- Optimal memory allocation
- Connection reuse
- Proper timeout settings
- Reserved concurrency where needed

### DynamoDB
- Single-table design for cost efficiency
- Proper partition key distribution
- Global Secondary Indexes for access patterns
- On-demand billing for unpredictable workloads

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow established patterns
- Write meaningful commit messages
- Include tests for new features

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clean and rebuild
npm run clean
npm run build
```

**Deployment Failures**
```bash
# Check diff before deploying
npm run diff
# Deploy incrementally
npm run deploy:database
npm run deploy:compute
```

**Lambda Function Errors**
- Check CloudWatch logs
- Verify IAM permissions
- Test with sample payloads
- Check environment variables

### Debugging Tips
- Use CloudWatch Logs for runtime errors
- Use X-Ray for distributed tracing
- Test functions locally with sample events
- Verify DynamoDB permissions and table existence

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB Single-Table Design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)