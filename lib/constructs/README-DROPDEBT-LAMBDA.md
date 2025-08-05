# DropDebt Lambda Construct

A specialized CDK construct for creating Lambda functions tailored to DropDebt's business logic needs, with built-in authentication, database access patterns, and business logic support.

## Features

- **JWT Authentication Integration**: Automatic Cognito User Pool integration for token validation
- **User Data Isolation**: Built-in DynamoDB permission patterns ensuring users can only access their own data
- **DropDebt Data Patterns**: Pre-configured access patterns for bills, expenses, payment plans, and user profiles
- **Business Logic Support**: Environment variables and permissions for prioritization, budget calculations, and payment splitting
- **Minimal Configuration**: Rapid development with sensible defaults

## Quick Start

```typescript
import { DropDebtLambda } from './constructs/dropdebt-lambda';
import { DropDebtFeatures } from './constructs/dropdebt-features';

// Create a bill prioritization Lambda
const billPrioritization = new DropDebtLambda(this, 'BillPrioritization', {
  functionName: 'bill-prioritization',
  codePath: './lambda/bill-prioritization',
  handler: 'index.handler',
  table: databaseStack.table,
  userPool: authStack.userPool,
  feature: DropDebtFeatures.BILL_PRIORITIZATION
});
```

## Pre-built Feature Configurations

### Available Features

- `DropDebtFeatures.AUTH` - User authentication and profile management
- `DropDebtFeatures.BILL_MANAGEMENT` - Bill CRUD operations
- `DropDebtFeatures.BILL_PRIORITIZATION` - Priority matrix calculations with GSI access
- `DropDebtFeatures.PAYMENT_SPLITTING` - Payment allocation algorithms
- `DropDebtFeatures.EXPENSE_TRACKING` - Expense management with budget calculations
- `DropDebtFeatures.BUDGET_PROTECTION` - Essential expense protection
- `DropDebtFeatures.PAYMENT_PLANS` - Payment plan creation and management
- `DropDebtFeatures.DASHBOARD` - Data aggregation for dashboard views
- `DropDebtFeatures.REPORTING` - Analytics and reporting functions

### Data Access Patterns

Each feature automatically configures the appropriate data access patterns:

- `USER_PROFILE` - Read user profile: `PK=USER#userId`
- `USER_BILLS` - User bills: `PK=USER#userId, SK=BILL#*`
- `USER_EXPENSES` - User expenses: `PK=USER#userId, SK=EXPENSE#*`
- `PAYMENT_PLANS` - Payment plans: `PK=USER#userId, SK=PLAN#*`
- `PRIORITY_QUERIES` - Priority-based queries via GSI1
- `USER_SETTINGS` - User settings: `PK=USER#userId, SK=SETTINGS`

## Environment Variables

The construct automatically provides these environment variables to your Lambda functions:

### Core Configuration
- `TABLE_NAME` - DynamoDB table name
- `GSI1_NAME` - Global Secondary Index name (always "GSI1")
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_REGION` - AWS region
- `REGION` - AWS region

### Feature Configuration
- `FEATURE_NAME` - Feature identifier for logging
- `DATA_PATTERNS` - Comma-separated list of enabled data patterns
- `ENABLE_BUDGET_CALCULATIONS` - Boolean flag for budget features
- `ENABLE_PRIORITIZATION` - Boolean flag for priority features
- `ENABLE_PAYMENT_PLANS` - Boolean flag for payment plan features

### Runtime Configuration
- `LOG_LEVEL` - Logging level (INFO by default)
- `NODE_ENV` - Environment (production by default)

## IAM Permissions

The construct automatically creates IAM permissions based on the selected data patterns:

### DynamoDB Permissions
- Base CRUD operations: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`
- Query operations for bill/expense patterns: `Query`
- GSI access for priority queries: `Query` on GSI1
- User data isolation via condition: `dynamodb:LeadingKeys` must match `USER#${cognito-identity.amazonaws.com:sub}`

### Cognito Permissions
- JWT validation: `cognito-idp:GetUser`, `cognito-idp:AdminGetUser`

## Lambda Layer Integration

Use the provided utility layer for common business logic:

```javascript
const dropdebtUtils = require('/opt/dropdebt-utils');

exports.handler = async (event) => {
  try {
    // JWT validation
    const { userId } = await dropdebtUtils.validateJwtToken(token);
    
    // Data access
    const bills = await dropdebtUtils.getUserBills(userId);
    
    // Business logic
    const priority = dropdebtUtils.calculateBillPriority(bill, factors);
    
    // Response formatting
    return dropdebtUtils.formatSuccessResponse(data);
  } catch (error) {
    return dropdebtUtils.formatErrorResponse(error.message);
  }
};
```

## Example Usage Patterns

### 1. Bill Prioritization Function

```typescript
const billPrioritization = new DropDebtLambda(this, 'BillPrioritization', {
  functionName: 'bill-prioritization',
  codePath: './lambda/bill-prioritization',
  handler: 'index.handler',
  table: databaseStack.table,
  userPool: authStack.userPool,
  feature: DropDebtFeatures.BILL_PRIORITIZATION,
  environment: {
    DEFAULT_PRIORITY_FACTORS: JSON.stringify({
      dueDateWeight: 0.3,
      essentialWeight: 0.4,
      lateFeeWeight: 0.2,
      interestWeight: 0.1
    })
  }
});
```

### 2. Payment Splitting Function

```typescript
const paymentSplitting = new DropDebtLambda(this, 'PaymentSplitting', {
  functionName: 'payment-splitting',
  codePath: './lambda/payment-splitting',
  handler: 'index.handler',
  table: databaseStack.table,
  userPool: authStack.userPool,
  feature: DropDebtFeatures.PAYMENT_SPLITTING,
  timeout: cdk.Duration.seconds(45),
  memorySize: 1024,
  environment: {
    MAX_PAYMENT_ITERATIONS: '100',
    DEFAULT_STRATEGY: 'priority_first'
  }
});
```

### 3. Quick Prototyping

```typescript
import { QuickDropDebtLambda } from './constructs/dropdebt-lambda-examples';

const expenseTracker = QuickDropDebtLambda.create(this, 'ExpenseTracker', {
  functionName: 'expense-tracking',
  feature: 'EXPENSE_TRACKING',
  table: databaseStack.table,
  userPool: authStack.userPool
});
```

## Lambda Function Structure

Your Lambda functions should follow this pattern:

```javascript
const dropdebtUtils = require('/opt/dropdebt-utils');

exports.handler = async (event) => {
  try {
    // 1. Extract and validate JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = authHeader.substring(7);
    const { userId: tokenUserId } = await dropdebtUtils.validateJwtToken(token);

    // 2. Extract user ID from request
    const requestUserId = dropdebtUtils.extractUserIdFromEvent(event);
    
    // 3. Validate user data access
    dropdebtUtils.validateUserDataAccess(requestUserId, tokenUserId);

    // 4. Handle business logic based on HTTP method
    switch (event.httpMethod) {
      case 'GET': return await handleGet(requestUserId);
      case 'POST': return await handlePost(requestUserId, event.body);
      // ... other methods
    }

  } catch (error) {
    dropdebtUtils.logError('Function error', error);
    return dropdebtUtils.formatErrorResponse(error.message);
  }
};
```

## Data Model Examples

The construct works with these DropDebt data models:

### User Profile
```javascript
{
  PK: "USER#user123",
  SK: "USER#user123",
  userId: "user123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe"
}
```

### Bill
```javascript
{
  PK: "USER#user123",
  SK: "BILL#bill456",
  GSI1PK: "USER#user123#PRIORITY",  // For priority queries
  GSI1SK: "000085",                 // Priority score (padded)
  billId: "bill456",
  name: "Credit Card",
  amount: 1500,
  dueDate: "2024-01-15",
  isEssential: false,
  priority: 85
}
```

### Expense
```javascript
{
  PK: "USER#user123",
  SK: "EXPENSE#exp789",
  expenseId: "exp789",
  name: "Rent",
  amount: 1200,
  isEssential: true,
  category: "housing"
}
```

## Advanced Features

### Admin Access
For functions that need cross-user access:

```typescript
const adminFunction = new DropDebtLambda(this, 'AdminReports', {
  // ... normal configuration
});

// Grant additional permissions
adminFunction.grantAdminAccess();
```

### Metrics Access
For functions that publish custom metrics:

```typescript
const metricsFunction = new DropDebtLambda(this, 'Dashboard', {
  // ... normal configuration
});

metricsFunction.grantMetricsAccess();
```

## Best Practices

1. **Use Pre-built Features**: Start with `DropDebtFeatures` configurations rather than custom ones
2. **Layer Integration**: Always use the utility layer for common operations
3. **Error Handling**: Use the utility layer's error formatting for consistency
4. **Logging**: Use structured logging via the utility layer
5. **Data Validation**: Always validate user data access and required fields
6. **JWT Validation**: Validate tokens and extract user IDs consistently

## Integration with API Gateway

The construct outputs Lambda function ARNs that can be used with API Gateway:

```typescript
// In your API stack
import { aws_apigateway as apigateway } from 'aws-cdk-lib';

const api = new apigateway.RestApi(this, 'DropDebtApi');
const users = api.root.addResource('users');
const userResource = users.addResource('{userId}');
const prioritization = userResource.addResource('prioritization');

prioritization.addMethod('GET', new apigateway.LambdaIntegration(billPrioritizationLambda.function));
prioritization.addMethod('POST', new apigateway.LambdaIntegration(billPrioritizationLambda.function));
```

This construct provides everything needed to rapidly develop DropDebt's core business logic while maintaining security, consistency, and best practices.