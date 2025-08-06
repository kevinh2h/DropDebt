# DropDebt Bills Data Model

## Overview

The DropDebt Bills Data Model implements consequence-based prioritization for overdue bills, focusing on real-world impacts rather than just amounts owed. This system helps users make informed decisions about which bills to pay first based on actual consequences they face.

## Core Philosophy

**Traditional approach**: Pay highest amounts or oldest bills first
**DropDebt approach**: Pay bills with most severe immediate consequences first

### Priority Matrix Factors

1. **Immediate Consequences (40% weight)**: Shutoff, eviction, repossession, license suspension
2. **Financial Impact (25% weight)**: Late fees, interest, credit damage costs  
3. **Recovery Difficulty (20% weight)**: Time and cost to fix after default
4. **Due Date Urgency (10% weight)**: Traditional overdue calculation
5. **Amount Relative (5% weight)**: Bill size consideration

## Data Model Architecture

### DynamoDB Single-Table Design

**Primary Table**: `dropdebt-data`
- **PK**: `USER#{userId}` - Ensures user data isolation
- **SK**: `BILL#{billId}` - Unique bill identifier
- **GSI1**: Priority-based queries
  - **GSI1PK**: `USER#{userId}#PRIORITY`
  - **GSI1SK**: Zero-padded priority score (e.g., "000095")

### Bill Interface Structure

```typescript
interface Bill {
  // DynamoDB Keys
  PK: string;           // USER#user123
  SK: string;           // BILL#electric-001
  GSI1PK: string;       // USER#user123#PRIORITY  
  GSI1SK: string;       // 000095 (priority score)
  
  // Basic Information
  billId: string;
  userId: string;
  name: string;
  type: BillType;       // ELECTRIC, RENT, CREDIT_CARD, etc.
  status: BillStatus;   // ACTIVE, OVERDUE, PAID, etc.
  
  // Financial Details
  originalAmount: number;
  currentBalance: number;
  minimumPayment?: number;
  interestRate?: number;
  
  // Priority & Consequences
  priority: number;                    // 0-100 calculated score
  isEssential: boolean;
  consequences: BillConsequence[];     // Array of consequence objects
  highestConsequenceSeverity: number;  // Max severity from consequences
  daysOverdue: number;
  
  // ... additional fields
}
```

## Consequence Types

### 1. Utility Shutoff Consequences
**Risk**: Essential services disconnected
**Severity**: 85-100 (electric, gas, water highest)
**Timeline**: 1-14 days typically

```typescript
interface UtilityShutoffConsequence {
  type: 'SHUTOFF';
  utilityType: 'electric' | 'gas' | 'water' | 'internet' | 'phone';
  shutoffDate?: string;      // Known disconnection date
  reconnectionFee: number;   // Cost to restore service
  depositRequired?: number;  // Additional deposit needed
  gracePeriodDays: number;   // Days before shutoff
  winterMoratorium?: boolean; // Winter protection
}
```

**Example**: Electric bill 7 days overdue with shutoff notice → Priority Score: 95

### 2. Housing Loss Consequences  
**Risk**: Eviction or foreclosure
**Severity**: 85-95 (housing is critical)
**Timeline**: 3-90 days depending on process

```typescript
interface HousingLossConsequence {
  type: 'EVICTION' | 'FORECLOSURE';
  noticeDate?: string;
  courtDate?: string;
  moveOutDate?: string;
  legalFees?: number;
  movingCosts?: number;
  securityDepositLoss?: number;
}
```

**Example**: Rent 30+ days overdue with 3-day notice → Priority Score: 90

### 3. Vehicle Repossession
**Risk**: Car/truck repossessed  
**Severity**: 80-95 (essential for work/school)
**Timeline**: Can happen immediately after default

```typescript
interface VehicleRepoConsequence {
  type: 'REPOSSESSION';
  vehicleValue: number;
  deficiencyBalance?: number;    // Amount owed after repo
  repoFees?: number;
  storageFeesPerDay?: number;
  redemptionPeriodDays?: number; // Time to recover vehicle
}
```

### 4. License Suspension
**Risk**: Driver's license suspended
**Severity**: 70-85 
**Timeline**: Automatic for insurance lapses

```typescript
interface LicenseSuspensionConsequence {
  type: 'LICENSE_SUSPENSION';
  suspensionType: 'drivers_license' | 'vehicle_registration' | 'professional_license';
  reinstatementFee: number;
  additionalRequirements?: string[];
}
```

### 5. Credit Damage
**Risk**: Credit score impact
**Severity**: 50-80 depending on current score
**Timeline**: 30+ days late typically

```typescript
interface CreditDamageConsequence {
  type: 'CREDIT_DAMAGE';
  estimatedScoreDrop: number;
  reportingDate?: string;        // When it hits credit report
  yearsOnReport: number;         // Usually 7 years
  impactOnBorrowing: 'severe' | 'moderate' | 'minimal';
}
```

### 6. Late Fee Consequences
**Risk**: Accumulating fees
**Severity**: 20-60
**Timeline**: Immediate or monthly

```typescript
interface LateFeeConsequence {
  type: 'LATE_FEES';
  lateFeeAmount: number;
  isCompounding: boolean;
  compoundingFrequency?: 'daily' | 'weekly' | 'monthly';
  maxFeeAmount?: number;
}
```

## Priority Calculation Algorithm

### Scoring Components (0-100 each)

1. **Immediate Consequence Score**
   - Shutoff risk: Days until shutoff (≤3 days = 100 points)
   - Essential services bonus: +20 points
   - Winter protection: -30% if applicable

2. **Financial Impact Score**  
   - Late fees as % of balance
   - Interest rate impact
   - Credit score drop severity

3. **Recovery Difficulty Score**
   - Recovery cost as % of original bill
   - Time to recover (months)
   - Non-recoverable consequences: +50 points

4. **Due Date Score**
   - Overdue: 50-100 based on days
   - Future due: 5-40 based on urgency

5. **Amount Score**
   - Relative to typical bills (simple ratio)

### Final Priority Formula

```
Priority = (
  ImmediateConsequence × 0.40 +
  FinancialImpact × 0.25 +
  RecoveryDifficulty × 0.20 +
  DueDate × 0.10 +
  Amount × 0.05
)
```

## Query Patterns

### Get Bills by Priority (Most Important)
```typescript
// Uses GSI1 for efficient priority-based queries
const params = {
  TableName: 'dropdebt-data',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :gsi1pk',
  ExpressionAttributeValues: {
    ':gsi1pk': 'USER#user123#PRIORITY'
  },
  ScanIndexForward: false, // Highest priority first
  Limit: 20
};
```

### Get User's Bills
```typescript
const params = {
  TableName: 'dropdebt-data',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
  ExpressionAttributeValues: {
    ':pk': 'USER#user123',
    ':sk_prefix': 'BILL#'
  }
};
```

### Get Critical Bills (Priority ≥ 90)
```typescript
const params = {
  TableName: 'dropdebt-data',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK >= :min_priority',
  ExpressionAttributeValues: {
    ':gsi1pk': 'USER#user123#PRIORITY',
    ':min_priority': '000090'
  }
};
```

## Real-World Scenarios

### Scenario 1: Single Parent - Utilities at Risk
- **Electric Bill**: 7 days overdue, shutoff notice → **Priority: 95**
- **Rent**: 32 days overdue, eviction notice → **Priority: 90** 
- **Credit Card**: 23 days overdue, credit risk → **Priority: 65**
- **Internet**: 18 days overdue, non-essential → **Priority: 40**

**Recommendation**: Pay electric first (prevent shutoff), then negotiate rent payment plan.

### Scenario 2: College Student - Transportation Risk
- **Car Payment**: 28 days overdue, repo risk → **Priority: 95**
- **Car Insurance**: Lapsed, license suspension → **Priority: 85**
- **Student Loan**: 18 days overdue, default risk → **Priority: 70**

**Recommendation**: Address car payment and insurance immediately to maintain transportation for work/school.

### Scenario 3: Small Business - Operations Risk  
- **Business Electric**: 23 days overdue, operations shutdown → **Priority: 100**
- **Commercial Rent**: 63 days overdue, eviction proceedings → **Priority: 90**
- **Business Credit Card**: 13 days overdue, high interest → **Priority: 65**

**Recommendation**: Pay business electric to prevent revenue loss, negotiate rent payment plan.

## API Endpoints

### Bill Management
- `GET /users/{userId}/bills` - Get all bills
- `GET /users/{userId}/bills/priority` - Get bills by priority
- `GET /users/{userId}/bills/critical` - Get critical bills (90+ priority)
- `GET /users/{userId}/bills/overdue` - Get overdue bills
- `POST /users/{userId}/bills` - Create new bill
- `PUT /users/{userId}/bills/{billId}` - Update bill
- `DELETE /users/{userId}/bills/{billId}` - Archive bill

### Priority Calculation
- `POST /users/{userId}/bills/calculate-priority` - Calculate payment allocation
- `POST /users/{userId}/bills/recalculate-all` - Recalculate all priorities

### Sample Data
- `GET /users/{userId}/bills/sample-data?scenario=single-parent` - Get sample bills
- `POST /users/{userId}/bills/load-sample-data` - Load sample scenario

## Usage Examples

### Creating a Bill with Consequences

```typescript
const electricBill = {
  name: 'Electric Bill - City Power',
  type: 'ELECTRIC',
  originalAmount: 245.67,
  currentBalance: 270.67,
  dueDate: '2024-01-20T00:00:00Z',
  isEssential: true,
  consequences: [
    {
      type: 'SHUTOFF',
      urgency: 'IMMEDIATE',
      severity: 95,
      description: 'Electric service will be disconnected in 3 days',
      estimatedDays: 3,
      utilityType: 'electric',
      shutoffDate: '2024-02-05T17:00:00Z',
      reconnectionFee: 150.00,
      gracePeriodDays: 10
    }
  ],
  paymentTerms: {
    gracePeriodDays: 10,
    lateFeeAmount: 25.00
  },
  creditor: {
    name: 'City Power Company',
    phone: '555-123-4567'
  }
};

const createdBill = await billService.createBill(electricBill);
// Automatically calculates priority: 95
```

### Payment Allocation by Priority

```typescript
const request = {
  availableAmount: 1500,
  priorityFactors: {
    immediateConsequenceWeight: 0.40,
    financialImpactWeight: 0.25,
    recoveryDifficultyWeight: 0.20,
    dueDateWeight: 0.10,
    amountWeight: 0.05
  }
};

const result = await fetch('/users/user123/bills/calculate-priority', {
  method: 'POST',
  body: JSON.stringify(request)
});

// Returns prioritized bills with recommended payments:
// [
//   { billId: 'electric-001', priority: 95, recommendedPayment: 270.67 },
//   { billId: 'rent-001', priority: 90, recommendedPayment: 1229.33 },
//   { remainingAmount: 0 }
// ]
```

## Security & Data Isolation

### User Data Isolation
- All bill data scoped to `USER#{userId}` partition key
- JWT validation ensures users can only access their own data
- No cross-user data leakage possible with DynamoDB queries

### Sensitive Data Handling
- Account numbers stored encrypted/masked
- Phone numbers and addresses properly secured
- No PII in CloudWatch logs

## Performance Considerations

### DynamoDB Optimization
- Single-table design minimizes API calls
- GSI1 enables efficient priority-based queries  
- Zero-padded priority scores ensure proper sorting
- User data isolation prevents hot partitions

### Caching Strategy
- JWT validation results cached (10 minutes)
- Priority calculations cached until bill updates
- Static consequence definitions cached

## Testing & Validation

### Sample Data Scenarios
- Single parent with utility shutoffs
- College student with transportation risks  
- Small business with operational risks
- Retiree with healthcare needs

### Priority Algorithm Testing
- Consequence severity validation
- Edge case handling (zero amounts, future dates)
- Custom priority factor validation
- Performance benchmarking

## Future Enhancements

### Planned Features
1. **Machine Learning**: Learn from user payment behavior
2. **Integration**: Connect to bank accounts and creditors
3. **Notifications**: Alert users of approaching consequences
4. **Negotiation**: Automated creditor communication
5. **Analytics**: Historical consequence trend analysis

### Scalability Considerations
- Horizontal DynamoDB scaling with user-based partitioning
- Lambda function optimization for batch operations
- CloudFront caching for static content
- ElastiCache for frequently accessed data

---

This data model provides the foundation for DropDebt's core value proposition: helping users make informed decisions about bill prioritization based on real-world consequences, not just amounts owed.