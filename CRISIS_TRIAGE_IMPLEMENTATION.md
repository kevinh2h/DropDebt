# DropDebt Crisis Triage System - Implementation

## Overview

The Crisis Triage System replaces the over-engineered payment splitting engine with a simple, crisis-focused system that tells users exactly what to pay when to avoid immediate consequences. No complex optimization - just clear emergency guidance.

**Key Problem Solved:** The previous system failed users with minimal funds (Karen's User 3 scenario: $150 available vs $960 in bills generated 0 payments). The crisis triage system works for ALL users regardless of available funds.

## Architecture Components

### 1. Crisis Triage Handler (`src/handlers/payment-splits/index.js`)

**Core Function**: `performCrisisTriage()`
- Gets bills from Bills Lambda
- Gets available money from Essential Needs Lambda  
- Performs simple triage logic (no complex optimization)
- Provides immediate actions and emergency resources

**Key Features:**
- **Crisis Detection**: `totalCriticalAmount > usableAmount && criticalBills.length > 0`
- **Simple Actions**: PAY_NOW, PAY_PARTIAL, CALL_CREDITOR, GET_HELP
- **Emergency Resources**: 2-1-1, LIHEAP, creditor contact guidance
- **Consequence Timeline**: Shows exact deadlines and what happens

### 2. Crisis Triage Logic (`src/shared/calculations/crisis-triage.ts`)

**Simple Algorithm:**
1. Sort bills by urgency (CRITICAL + nearest deadlines first)
2. Use strategy percentage of available money (50%/70%/90%)
3. Generate clear actions for each bill:
   - Can pay full amount → PAY_NOW
   - Can pay partial → PAY_PARTIAL + call creditor
   - Cannot pay → GET_HELP + emergency resources

**No Complex Features:**
- ❌ Seasonal factors and income variability modeling
- ❌ Three-strategy optimization with health scoring  
- ❌ Milestone gamification and progress tracking
- ✅ Simple crisis detection and emergency guidance

### 3. Consequence Timeline (`src/shared/utils/consequence-timeline.ts`)

Shows exact deadlines and consequences:
- **Electric**: "Power will be shut off - reconnection fee required"
- **Rent**: "Eviction notice posted - court proceedings begin"
- **Car**: "Vehicle repossession - transportation lost"

**Timeline Organization:**
- `urgent`: Within 3 days
- `thisWeek`: Within 7 days  
- `nextWeek`: 7-14 days
- `thisMonth`: 14-30 days

### 4. Payment Strategy (`src/shared/calculations/payment-strategy.ts`)

**Three Simple Strategies:**
- **Conservative (50%)**: Large safety buffer, pays fewer bills
- **Balanced (70%)**: Reasonable buffer, most users
- **Aggressive (90%)**: Minimal buffer, pays more bills

**Simple Distribution:**
1. Sort by priority (CRITICAL → HIGH → MEDIUM → LOW)
2. Pay bills in order until money runs out
3. Minimum $10 payment threshold (vs rigid $25 that failed users)
4. Show clear consequences for unpaid bills

### 5. Emergency Assistance (`src/shared/resources/emergency-assistance.ts`)

**Crisis Response System:**
- **EMERGENCY**: Housing + utilities at risk, very little money
- **CRISIS**: Multiple critical bills or utilities with no money  
- **URGENT**: Some critical bills but manageable

**Immediate Resources:**
- 2-1-1 emergency assistance hotline
- LIHEAP utility assistance programs
- Local housing assistance search terms
- Creditor negotiation tips

## Key Improvements Over Previous System

### ✅ Works for Crisis Users
- **Before**: User 3 ($150 available, $960 bills) → 0 payments generated
- **After**: User 3 → Partial electric payment + clear crisis guidance

### ✅ Simple and Actionable
- **Before**: 9 health metrics, seasonal factors, milestone tracking
- **After**: Clear actions: "PAY NOW: Electric $320 - prevents power shutoff"

### ✅ Emergency Focus
- **Before**: Financial optimization for people who need triage
- **After**: Crisis triage with immediate emergency resources

### ✅ Real Consequences
- **Before**: Abstract health scores and optimization metrics
- **After**: "Electric: Power shutoff in 3 days if not paid"

## Integration Points

### Bills Lambda
- **Endpoint**: GET `/priority` 
- **Data**: Bills with priority categories and current balances
- **Usage**: Get critical bills for triage

### Essential Needs Lambda  
- **Endpoint**: POST `/expenses/calculate`
- **Data**: `availableForDebt` amount after essential needs
- **Usage**: Determine how much money is available for bills

### DynamoDB Storage
- **Crisis Alerts**: `USER#{userId}#CRISIS_ALERT#{alertId}`
- **Tracking**: Store crisis situations for pattern analysis
- **No Complex Plans**: Removed payment plan storage complexity

## Testing Results

### Karen's Critical Scenario (User 3)
- **Input**: $150 available, $960 total bills (2 CRITICAL, 1 HIGH)
- **Output**: 
  - Crisis detected ✅
  - 1 action generated (partial electric payment) ✅
  - 3 consequences shown ✅
  - 3 help resources provided (2-1-1, LIHEAP, creditor contact) ✅

### Edge Cases
- **$25 Available**: Provides help resources even with minimal funds ✅
- **Sufficient Funds**: Handles non-crisis scenarios correctly ✅

## File Structure

```
src/
├── handlers/
│   └── payment-splits/
│       └── index.js                    # Crisis triage Lambda handler
├── shared/
│   ├── calculations/
│   │   ├── crisis-triage.ts           # Simple triage logic  
│   │   └── payment-strategy.ts        # 3 simple strategies
│   ├── resources/
│   │   └── emergency-assistance.ts    # Crisis help resources
│   ├── types/
│   │   └── payment-splits.ts          # Simple crisis triage types
│   └── utils/
│       └── consequence-timeline.ts    # Exact deadline tracking
```

## Key Lesson

**Karen's Assessment**: "People drowning don't need swimming optimization algorithms - they need someone to throw them a life preserver with clear instructions."

The crisis triage system focuses on **immediate user needs** rather than **theoretical optimization**, making it actually useful for people in financial crisis.