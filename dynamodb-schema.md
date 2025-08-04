# DropDebt DynamoDB Single-Table Design

## Table Configuration
- **Table Name**: `dropdebt-data`
- **Billing Mode**: Pay-per-request
- **Primary Key**: Composite (PK + SK)

## Core Schema Design

### Primary Table Structure
```
PK (Partition Key): String
SK (Sort Key): String
GSI1PK (Global Secondary Index 1 PK): String
GSI1SK (Global Secondary Index 1 SK): String
EntityType: String
CreatedAt: String (ISO 8601)
UpdatedAt: String (ISO 8601)
```

### Global Secondary Index (GSI1)
- **Index Name**: `GSI1`
- **PK**: `GSI1PK`
- **SK**: `GSI1SK`
- **Purpose**: Enable priority-based bill queries and cross-entity lookups

## Data Access Patterns

### 1. Users Entity
**Pattern**: Store user profile and metadata
```
PK: USER#<userId>
SK: PROFILE
EntityType: User
GSI1PK: USER#<userId>
GSI1SK: PROFILE
```

**Sample User Item**:
```json
{
  "PK": "USER#user123",
  "SK": "PROFILE",
  "EntityType": "User",
  "GSI1PK": "USER#user123",
  "GSI1SK": "PROFILE",
  "UserId": "user123",
  "Email": "john.doe@example.com",
  "FirstName": "John",
  "LastName": "Doe",
  "Phone": "+1234567890",
  "PreferredPaymentMethod": "bank_transfer",
  "TotalMonthlyIncome": 5000,
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Bills Entity
**Pattern**: Store bills with priority scoring for efficient querying
```
PK: USER#<userId>
SK: BILL#<billId>
EntityType: Bill
GSI1PK: BILLS_BY_PRIORITY#<userId>
GSI1SK: <priority_score>#<due_date>#<billId>
```

**Sample Bill Item**:
```json
{
  "PK": "USER#user123",
  "SK": "BILL#bill456",
  "EntityType": "Bill",
  "GSI1PK": "BILLS_BY_PRIORITY#user123",
  "GSI1SK": "095#2024-02-15T00:00:00Z#bill456",
  "BillId": "bill456",
  "UserId": "user123",
  "BillName": "Credit Card Payment",
  "Amount": 450.00,
  "DueDate": "2024-02-15T00:00:00Z",
  "PriorityScore": 95,
  "Category": "debt",
  "IsEssential": true,
  "Status": "pending",
  "MinimumPayment": 45.00,
  "InterestRate": 18.5,
  "LateFee": 35.00,
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Expenses Entity
**Pattern**: Store expense categories and budgets
```
PK: USER#<userId>
SK: EXPENSE#<expenseId>
EntityType: Expense
GSI1PK: EXPENSES_BY_TYPE#<userId>
GSI1SK: <essential_flag>#<category>#<expenseId>
```

**Sample Expense Item**:
```json
{
  "PK": "USER#user123",
  "SK": "EXPENSE#exp789",
  "EntityType": "Expense",
  "GSI1PK": "EXPENSES_BY_TYPE#user123",
  "GSI1SK": "ESSENTIAL#housing#exp789",
  "ExpenseId": "exp789",
  "UserId": "user123",
  "ExpenseName": "Rent",
  "Category": "housing",
  "Amount": 1200.00,
  "IsEssential": true,
  "Frequency": "monthly",
  "DueDay": 1,
  "Description": "Monthly apartment rent",
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z"
}
```

### 4. Payment Arrangements Entity
**Pattern**: Store payment splitting and scheduling information
```
PK: USER#<userId>
SK: ARRANGEMENT#<arrangementId>
EntityType: PaymentArrangement
GSI1PK: ARRANGEMENTS_BY_STATUS#<userId>
GSI1SK: <status>#<next_payment_date>#<arrangementId>
```

**Sample Payment Arrangement Item**:
```json
{
  "PK": "USER#user123",
  "SK": "ARRANGEMENT#arr101",
  "EntityType": "PaymentArrangement",
  "GSI1PK": "ARRANGEMENTS_BY_STATUS#user123",
  "GSI1SK": "active#2024-02-01T00:00:00Z#arr101",
  "ArrangementId": "arr101",
  "UserId": "user123",
  "BillId": "bill456",
  "TotalAmount": 450.00,
  "SplitType": "installments",
  "InstallmentCount": 3,
  "InstallmentAmount": 150.00,
  "PaymentFrequency": "monthly",
  "NextPaymentDate": "2024-02-01T00:00:00Z",
  "Status": "active",
  "AutoPay": true,
  "PaymentMethod": "bank_transfer",
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z"
}
```

## Common Query Patterns

### 1. Get User Profile
```
Query: PK = "USER#user123" AND SK = "PROFILE"
```

### 2. Get All Bills for User (ordered by priority)
```
Query GSI1: GSI1PK = "BILLS_BY_PRIORITY#user123"
Sort: GSI1SK descending (highest priority first)
```

### 3. Get High Priority Bills Only
```
Query GSI1: GSI1PK = "BILLS_BY_PRIORITY#user123" 
Filter: GSI1SK begins_with "09" (priority 90-99)
```

### 4. Get User's Essential Expenses
```
Query GSI1: GSI1PK = "EXPENSES_BY_TYPE#user123"
Filter: GSI1SK begins_with "ESSENTIAL"
```

### 5. Get Active Payment Arrangements
```
Query GSI1: GSI1PK = "ARRANGEMENTS_BY_STATUS#user123"
Filter: GSI1SK begins_with "active"
```

## AWS CLI Test Commands

### Create Table
```bash
aws dynamodb create-table \
    --table-name dropdebt-data \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema='[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',BillingMode=PAY_PER_REQUEST \
    --billing-mode PAY_PER_REQUEST
```

### Insert Test Data
```bash
# Insert User
aws dynamodb put-item \
    --table-name dropdebt-data \
    --item '{
        "PK": {"S": "USER#user123"},
        "SK": {"S": "PROFILE"},
        "EntityType": {"S": "User"},
        "GSI1PK": {"S": "USER#user123"},
        "GSI1SK": {"S": "PROFILE"},
        "UserId": {"S": "user123"},
        "Email": {"S": "john.doe@example.com"},
        "FirstName": {"S": "John"},
        "LastName": {"S": "Doe"},
        "TotalMonthlyIncome": {"N": "5000"},
        "CreatedAt": {"S": "2024-01-15T10:30:00Z"}
    }'

# Insert High Priority Bill
aws dynamodb put-item \
    --table-name dropdebt-data \
    --item '{
        "PK": {"S": "USER#user123"},
        "SK": {"S": "BILL#bill456"},
        "EntityType": {"S": "Bill"},
        "GSI1PK": {"S": "BILLS_BY_PRIORITY#user123"},
        "GSI1SK": {"S": "095#2024-02-15T00:00:00Z#bill456"},
        "BillId": {"S": "bill456"},
        "BillName": {"S": "Credit Card Payment"},
        "Amount": {"N": "450.00"},
        "PriorityScore": {"N": "95"},
        "Status": {"S": "pending"},
        "IsEssential": {"BOOL": true},
        "CreatedAt": {"S": "2024-01-15T10:30:00Z"}
    }'

# Insert Essential Expense
aws dynamodb put-item \
    --table-name dropdebt-data \
    --item '{
        "PK": {"S": "USER#user123"},
        "SK": {"S": "EXPENSE#exp789"},
        "EntityType": {"S": "Expense"},
        "GSI1PK": {"S": "EXPENSES_BY_TYPE#user123"},
        "GSI1SK": {"S": "ESSENTIAL#housing#exp789"},
        "ExpenseId": {"S": "exp789"},
        "ExpenseName": {"S": "Rent"},
        "Amount": {"N": "1200.00"},
        "IsEssential": {"BOOL": true},
        "Category": {"S": "housing"},
        "CreatedAt": {"S": "2024-01-15T10:30:00Z"}
    }'

# Insert Payment Arrangement
aws dynamodb put-item \
    --table-name dropdebt-data \
    --item '{
        "PK": {"S": "USER#user123"},
        "SK": {"S": "ARRANGEMENT#arr101"},
        "EntityType": {"S": "PaymentArrangement"},
        "GSI1PK": {"S": "ARRANGEMENTS_BY_STATUS#user123"},
        "GSI1SK": {"S": "active#2024-02-01T00:00:00Z#arr101"},
        "ArrangementId": {"S": "arr101"},
        "BillId": {"S": "bill456"},
        "TotalAmount": {"N": "450.00"},
        "InstallmentCount": {"N": "3"},
        "Status": {"S": "active"},
        "CreatedAt": {"S": "2024-01-15T10:30:00Z"}
    }'
```

### Test Queries
```bash
# Get user profile
aws dynamodb query \
    --table-name dropdebt-data \
    --key-condition-expression "PK = :pk AND SK = :sk" \
    --expression-attribute-values '{
        ":pk": {"S": "USER#user123"},
        ":sk": {"S": "PROFILE"}
    }'

# Get bills by priority (highest first)
aws dynamodb query \
    --table-name dropdebt-data \
    --index-name GSI1 \
    --key-condition-expression "GSI1PK = :gsi1pk" \
    --expression-attribute-values '{
        ":gsi1pk": {"S": "BILLS_BY_PRIORITY#user123"}
    }' \
    --scan-index-forward false

# Get essential expenses
aws dynamodb query \
    --table-name dropdebt-data \
    --index-name GSI1 \
    --key-condition-expression "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)" \
    --expression-attribute-values '{
        ":gsi1pk": {"S": "EXPENSES_BY_TYPE#user123"},
        ":prefix": {"S": "ESSENTIAL"}
    }'
```

## Priority Score Calculation Logic
- **90-99**: Critical bills (utilities, rent, minimum debt payments)
- **80-89**: Important bills (insurance, phone, internet)
- **70-79**: Regular bills (subscriptions, memberships)
- **60-69**: Optional bills (entertainment, dining)
- **Below 60**: Luxury/discretionary expenses

## Benefits of This Design
1. **Single table cost optimization** - All data in one table
2. **Efficient priority queries** - GSI enables fast bill prioritization
3. **Flexible access patterns** - Supports all required query types
4. **Scalable design** - Can handle growth without schema changes
5. **Immediate deployment ready** - All AWS CLI commands provided