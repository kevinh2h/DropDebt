/**
 * DropDebt Bills Management Lambda Handler
 * 
 * Implements comprehensive bill CRUD operations with consequence-based prioritization
 * Supports the Catch-Up Prioritization Matrix with real-world consequence analysis
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
// Inline utilities to avoid import issues
const getEnvironmentVariable = (name, defaultValue) => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue;
};

const successResponse = (data) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
});

const errorResponse = (message, statusCode = 500) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify({
    success: false,
    message: typeof message === 'string' ? message : 'Internal server error',
    timestamp: new Date().toISOString()
  })
});

// Simple JWT validation for testing (in production, use proper JWT verification)
const validateJWTToken = async (token) => {
  try {
    // For now, just return valid for any token that looks like a JWT
    if (token && token.includes('.')) {
      return { valid: true, decoded: { sub: 'acedb598-b051-70f1-f861-eab871a259ea' } };
    }
    return { valid: false, error: 'Invalid token format' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const extractUserIdFromToken = (decoded) => {
  return decoded.sub || 'acedb598-b051-70f1-f861-eab871a259ea';
};

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.DROPDEBT_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Bill Types and Status Enums
const BillStatus = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID', 
  OVERDUE: 'OVERDUE',
  IN_ARRANGEMENT: 'IN_ARRANGEMENT',
  ARCHIVED: 'ARCHIVED',
  CANCELLED: 'CANCELLED'
};

const BillType = {
  // Housing
  RENT: 'RENT',
  MORTGAGE: 'MORTGAGE',
  HOME_INSURANCE: 'HOME_INSURANCE',
  PROPERTY_TAX: 'PROPERTY_TAX',
  HOA_FEES: 'HOA_FEES',
  
  // Utilities
  ELECTRIC: 'ELECTRIC',
  GAS: 'GAS', 
  WATER: 'WATER',
  SEWER: 'SEWER',
  TRASH: 'TRASH',
  INTERNET: 'INTERNET',
  CABLE_TV: 'CABLE_TV',
  PHONE: 'PHONE',
  
  // Transportation
  CAR_PAYMENT: 'CAR_PAYMENT',
  CAR_INSURANCE: 'CAR_INSURANCE',
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
  
  // Financial
  CREDIT_CARD: 'CREDIT_CARD',
  PERSONAL_LOAN: 'PERSONAL_LOAN',
  STUDENT_LOAN: 'STUDENT_LOAN',
  PAYDAY_LOAN: 'PAYDAY_LOAN',
  
  // Healthcare
  HEALTH_INSURANCE: 'HEALTH_INSURANCE',
  MEDICAL_BILL: 'MEDICAL_BILL',
  PRESCRIPTION: 'PRESCRIPTION',
  
  // Other
  SUBSCRIPTION: 'SUBSCRIPTION',
  MEMBERSHIP: 'MEMBERSHIP',
  OTHER: 'OTHER'
};

const ConsequenceType = {
  SHUTOFF: 'SHUTOFF',
  EVICTION: 'EVICTION',
  FORECLOSURE: 'FORECLOSURE',
  REPOSSESSION: 'REPOSSESSION',
  LICENSE_SUSPENSION: 'LICENSE_SUSPENSION',
  CREDIT_DAMAGE: 'CREDIT_DAMAGE',
  LATE_FEES: 'LATE_FEES',
  COLLECTION: 'COLLECTION',
  LEGAL_ACTION: 'LEGAL_ACTION'
};

/**
 * Simplified Priority Calculator for Real-World Use
 * 3-tier system that users can understand intuitively
 */
class SimplePriorityCalculator {
  calculatePriority(bill) {
    const now = new Date();
    
    // Simple 3-tier priority system
    const { level, score, reasoning } = this.calculateSimplePriority(bill);

    return {
      finalScore: score,
      priorityLevel: level,
      calculatedAt: now.toISOString(),
      reasoning
    };
  }

  calculateSimplePriority(bill) {
    // CRITICAL (90-100): Essential services near shutoff
    if (this.isCritical(bill)) {
      return {
        level: 'CRITICAL',
        score: 95,
        reasoning: {
          primaryReason: 'Essential service shutoff or housing loss imminent',
          action: 'Pay immediately - contact creditor today',
          consequences: this.getShutoffConsequences(bill)
        }
      };
    }
    
    // HIGH (70-89): Credit damage risk or large late fees
    if (this.isHigh(bill)) {
      return {
        level: 'HIGH',
        score: 80,
        reasoning: {
          primaryReason: 'Credit damage or significant fees approaching',
          action: 'Pay this week - avoid long-term damage',
          consequences: this.getCreditConsequences(bill)
        }
      };
    }
    
    // MEDIUM (40-69): Overdue bills without immediate consequences
    if (this.isMedium(bill)) {
      return {
        level: 'MEDIUM',
        score: 55,
        reasoning: {
          primaryReason: 'Bill is overdue - address before escalation',
          action: 'Schedule payment or contact creditor',
          consequences: ['Late fees may apply', 'Could escalate to higher priority']
        }
      };
    }
    
    // LOW (10-39): Current or future bills
    return {
      level: 'LOW',
      score: 25,
      reasoning: {
        primaryReason: 'Bill is current - monitor due date',
        action: 'Schedule payment before due date',
        consequences: ['No immediate risk']
      }
    };
  }

  isCritical(bill) {
    // Essential services (utilities, housing, transportation) with immediate shutoff risk
    const essentialTypes = [BillType.ELECTRIC, BillType.GAS, BillType.WATER, BillType.RENT, BillType.MORTGAGE];
    const hasShutoffRisk = bill.consequences?.some(c => 
      c.type === ConsequenceType.SHUTOFF || 
      c.type === ConsequenceType.EVICTION || 
      c.type === ConsequenceType.FORECLOSURE ||
      (c.estimatedDays <= 7 && c.type === ConsequenceType.REPOSSESSION)
    );
    
    return bill.isEssential && essentialTypes.includes(bill.type) && hasShutoffRisk;
  }

  isHigh(bill) {
    // Credit cards 30+ days overdue (credit damage) or high late fees
    const creditDamageRisk = bill.daysOverdue >= 30 || 
      bill.consequences?.some(c => c.type === ConsequenceType.CREDIT_DAMAGE);
    
    const highLateFees = bill.paymentTerms?.lateFeeAmount > 50 ||
      (bill.paymentTerms?.lateFeeAmount / bill.currentBalance) > 0.05;
    
    return creditDamageRisk || highLateFees || bill.type === BillType.CREDIT_CARD && bill.daysOverdue > 0;
  }

  isMedium(bill) {
    // Any overdue bill that's not critical or high
    return bill.daysOverdue > 0;
  }

  getShutoffConsequences(bill) {
    const consequences = [];
    for (const consequence of bill.consequences || []) {
      if (consequence.estimatedDays <= 7) {
        consequences.push(consequence.description);
      }
    }
    return consequences.length > 0 ? consequences : ['Service disconnection risk'];
  }

  getCreditConsequences(bill) {
    const consequences = [];
    
    if (bill.daysOverdue >= 30) {
      consequences.push('Credit score damage - affects future borrowing');
    }
    
    if (bill.paymentTerms?.lateFeeAmount) {
      consequences.push(`Late fee: $${bill.paymentTerms.lateFeeAmount}`);
    }
    
    if (bill.interestRate > 0.15) {
      consequences.push(`High interest: ${(bill.interestRate * 100).toFixed(1)}% APR`);
    }
    
    return consequences.length > 0 ? consequences : ['Additional fees may apply'];
  }

  static generatePriorityGSIKeys(userId, priority) {
    return {
      GSI1PK: `USER#${userId}#PRIORITY`,
      GSI1SK: String(Math.round(priority)).padStart(6, '0') // Zero-padded for proper sorting
    };
  }
}

const priorityCalculator = new SimplePriorityCalculator();

/**
 * Calculate days overdue for a bill
 */
function calculateDaysOverdue(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Update bill priority and GSI keys
 */
async function updateBillPriority(bill) {
  // Calculate current days overdue
  bill.daysOverdue = calculateDaysOverdue(bill.dueDate);
  
  // Calculate priority
  const priorityCalculation = priorityCalculator.calculatePriority(bill);
  bill.priority = priorityCalculation.finalScore;
  bill.priorityCalculatedAt = priorityCalculation.calculatedAt;
  
  // Update GSI1 keys for priority queries
  const gsiKeys = SimplePriorityCalculator.generatePriorityGSIKeys(bill.userId, bill.priority);
  bill.GSI1PK = gsiKeys.GSI1PK;
  bill.GSI1SK = gsiKeys.GSI1SK;
  
  return { bill, priorityCalculation };
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  try {
    console.log('Bills Lambda - Received event:', JSON.stringify(event, null, 2));
    
    const tableName = getEnvironmentVariable('TABLE_NAME');
    const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
    const path = event.path || event.rawPath || '';
    
    // Parse request body first
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }
    
    // Extract JWT token and validate authentication (bypass for direct invocation testing)
    let userId = 'acedb598-b051-70f1-f861-eab871a259ea'; // Default test user
    
    if (event.headers && (event.headers.Authorization || event.headers.authorization)) {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (!authHeader.startsWith('Bearer ')) {
        return errorResponse('Missing or invalid Authorization header', 401);
      }
      
      const token = authHeader.substring(7);
      const tokenValidation = await validateJWTToken(token);
      if (!tokenValidation.valid) {
        return errorResponse(`Invalid JWT token: ${tokenValidation.error}`, 401);
      }
      
      userId = extractUserIdFromToken(tokenValidation.decoded);
    } else if (body.auth && body.auth.userId) {
      // Direct invocation - use provided userId
      userId = body.auth.userId;
    }
    console.log('Authenticated user:', userId);
    
    // Route to appropriate handler
    if (method === 'GET' && path.includes('/bills')) {
      if (path.includes('/priority')) {
        return await getBillsByPriority(tableName, userId);
      } else if (path.includes('/statistics')) {
        return await getBillStatistics(tableName, userId);
      } else {
        return await getAllBills(tableName, userId);
      }
    }
    
    if (method === 'POST' && path.includes('/bills')) {
      if (path.includes('/calculate-priorities')) {
        return await recalculateAllPriorities(tableName, userId);
      } else if (path.includes('/sample-data')) {
        return await loadSampleBills(tableName, userId);
      } else {
        return await createBill(tableName, userId, body);
      }
    }
    
    if (method === 'PUT' && path.includes('/bills/')) {
      const billId = extractBillIdFromPath(path);
      return await updateBill(tableName, userId, billId, body);
    }
    
    if (method === 'DELETE' && path.includes('/bills/')) {
      const billId = extractBillIdFromPath(path);
      return await deleteBill(tableName, userId, billId);
    }
    
    // Direct invocation support (for testing) - check both event level and body
    const operation = event.operation || body.operation;
    if (operation) {
      switch (operation) {
        case 'create':
          return await createBill(tableName, userId, body.bill);
        case 'get-all':
          return await getAllBills(tableName, userId);
        case 'get-priority':
          return await getBillsByPriority(tableName, userId);
        case 'update':
          return await updateBill(tableName, userId, body.billId, body.updates);
        case 'delete':
          return await deleteBill(tableName, userId, body.billId);
        case 'calculate-priorities':
          return await recalculateAllPriorities(tableName, userId);
        case 'load-sample':
          return await loadSampleBills(tableName, userId);
        case 'statistics':
          return await getBillStatistics(tableName, userId);
        default:
          return errorResponse(`Unknown operation: ${operation}`, 400);
      }
    }
    
    return errorResponse('Invalid request method or path', 400);
    
  } catch (error) {
    console.error('Bills Lambda error:', error);
    return errorResponse(error.message, 500);
  }
};

/**
 * Create a new bill
 */
async function createBill(tableName, userId, billData) {
  try {
    // Generate bill ID
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Validate required fields
    if (!billData.name || !billData.type || !billData.originalAmount || !billData.dueDate) {
      return errorResponse('Missing required fields: name, type, originalAmount, dueDate', 400);
    }
    
    // Create bill object
    const bill = {
      // DynamoDB keys
      PK: `USER#${userId}`,
      SK: `BILL#${billId}`,
      
      // Basic information
      billId,
      userId,
      name: billData.name,
      description: billData.description || '',
      type: billData.type,
      status: billData.status || BillStatus.ACTIVE,
      
      // Financial details
      originalAmount: billData.originalAmount,
      currentBalance: billData.currentBalance || billData.originalAmount,
      minimumPayment: billData.minimumPayment,
      interestRate: billData.interestRate,
      
      // Dates
      createdAt: now,
      updatedAt: now,
      dueDate: billData.dueDate,
      originalDueDate: billData.dueDate,
      
      // Consequence analysis
      isEssential: billData.isEssential || false,
      consequences: billData.consequences || [],
      
      // Payment terms
      paymentTerms: billData.paymentTerms || {
        gracePeriodDays: 10,
        lateFeeAmount: 25
      },
      
      // Creditor information
      creditor: billData.creditor || {
        name: 'Unknown Creditor'
      },
      
      // Metadata
      source: 'manual',
      category: billData.category || 'other',
      tags: billData.tags || []
    };
    
    // Calculate priority and update GSI keys
    const { bill: updatedBill, priorityCalculation } = await updateBillPriority(bill);
    
    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: updatedBill
    }));
    
    return successResponse({
      message: 'Bill created successfully',
      bill: updatedBill,
      priorityCalculation
    });
    
  } catch (error) {
    console.error('Create bill error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Get all bills for user
 */
async function getAllBills(tableName, userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'BILL#'
      }
    }));
    
    return successResponse({
      message: 'Bills retrieved successfully',
      bills: result.Items || [],
      count: result.Count || 0
    });
    
  } catch (error) {
    console.error('Get all bills error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Get bills sorted by priority (using GSI1)
 */
async function getBillsByPriority(tableName, userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#${userId}#PRIORITY`
      },
      ScanIndexForward: false // Sort by priority descending (highest first)
    }));
    
    return successResponse({
      message: 'Bills retrieved by priority successfully',
      bills: result.Items || [],
      count: result.Count || 0
    });
    
  } catch (error) {
    console.error('Get bills by priority error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Update an existing bill
 */
async function updateBill(tableName, userId, billId, updates) {
  try {
    // First get the existing bill
    const getResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `BILL#${billId}`
      }
    }));
    
    if (!getResult.Item) {
      return errorResponse('Bill not found', 404);
    }
    
    // Update the bill with new data
    const updatedBill = {
      ...getResult.Item,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Recalculate priority if relevant fields changed
    if (updates.dueDate || updates.currentBalance || updates.consequences || updates.status) {
      const { bill: prioritizedBill } = await updateBillPriority(updatedBill);
      updatedBill.priority = prioritizedBill.priority;
      updatedBill.priorityCalculatedAt = prioritizedBill.priorityCalculatedAt;
      updatedBill.GSI1PK = prioritizedBill.GSI1PK;
      updatedBill.GSI1SK = prioritizedBill.GSI1SK;
      updatedBill.daysOverdue = prioritizedBill.daysOverdue;
    }
    
    // Save updated bill
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: updatedBill
    }));
    
    return successResponse({
      message: 'Bill updated successfully',
      bill: updatedBill
    });
    
  } catch (error) {
    console.error('Update bill error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Delete (archive) a bill
 */
async function deleteBill(tableName, userId, billId) {
  try {
    // Soft delete by updating status
    const updatedBill = await updateBill(tableName, userId, billId, {
      status: BillStatus.ARCHIVED,
      archivedAt: new Date().toISOString()
    });
    
    return successResponse({
      message: 'Bill archived successfully',
      bill: updatedBill.data?.bill
    });
    
  } catch (error) {
    console.error('Delete bill error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Recalculate priorities for all user bills
 */
async function recalculateAllPriorities(tableName, userId) {
  try {
    // Get all bills
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'BILL#'
      }
    }));
    
    const bills = result.Items || [];
    let updatedCount = 0;
    
    // Update each bill's priority
    for (const bill of bills) {
      const { bill: updatedBill } = await updateBillPriority(bill);
      
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: updatedBill
      }));
      
      updatedCount++;
    }
    
    return successResponse({
      message: `Recalculated priorities for ${updatedCount} bills`,
      updatedCount,
      bills: bills.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    });
    
  } catch (error) {
    console.error('Recalculate priorities error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Get bill statistics for dashboard
 */
async function getBillStatistics(tableName, userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'BILL#'
      }
    }));
    
    const bills = result.Items || [];
    
    // Calculate statistics
    const stats = {
      totalBills: bills.length,
      totalOwed: bills.reduce((sum, bill) => sum + (bill.currentBalance || 0), 0),
      overdueCount: bills.filter(bill => bill.daysOverdue > 0).length,
      criticalCount: bills.filter(bill => (bill.priority || 0) >= 90).length,
      highPriorityCount: bills.filter(bill => (bill.priority || 0) >= 70 && (bill.priority || 0) < 90).length,
      byStatus: {},
      byType: {},
      priorityDistribution: {
        critical: bills.filter(bill => (bill.priority || 0) >= 90).length,
        high: bills.filter(bill => (bill.priority || 0) >= 70 && (bill.priority || 0) < 90).length,
        medium: bills.filter(bill => (bill.priority || 0) >= 40 && (bill.priority || 0) < 70).length,
        low: bills.filter(bill => (bill.priority || 0) < 40).length
      }
    };
    
    // Group by status
    bills.forEach(bill => {
      stats.byStatus[bill.status] = (stats.byStatus[bill.status] || 0) + 1;
    });
    
    // Group by type
    bills.forEach(bill => {
      stats.byType[bill.type] = (stats.byType[bill.type] || 0) + 1;
    });
    
    return successResponse({
      message: 'Bill statistics calculated successfully',
      statistics: stats,
      topPriorityBills: bills
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5)
    });
    
  } catch (error) {
    console.error('Get bill statistics error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Load sample bills for demonstration
 */
async function loadSampleBills(tableName, userId) {
  try {
    const sampleBills = [
      {
        name: 'Electric Bill - City Power',
        type: BillType.ELECTRIC,
        originalAmount: 245.67,
        currentBalance: 245.67,
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days overdue
        isEssential: true,
        consequences: [
          {
            type: ConsequenceType.SHUTOFF,
            severity: 95,
            description: 'Electric service will be disconnected in 3 days',
            estimatedDays: 3,
            preventable: true,
            recoverable: true,
            recoveryCost: 125.00,
            utilityType: 'electric'
          }
        ],
        paymentTerms: {
          gracePeriodDays: 10,
          lateFeeAmount: 25.00
        },
        creditor: {
          name: 'City Power Company',
          phone: '555-123-4567'
        },
        category: 'utilities',
        tags: ['essential', 'shutoff-risk']
      },
      {
        name: 'Rent Payment',
        type: BillType.RENT,
        originalAmount: 1200.00,
        currentBalance: 1200.00,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days overdue
        isEssential: true,
        consequences: [
          {
            type: ConsequenceType.EVICTION,
            severity: 90,
            description: 'Eviction proceedings may begin after 10 days',
            estimatedDays: 5,
            preventable: true,
            recoverable: true,
            recoveryCost: 500.00
          }
        ],
        paymentTerms: {
          gracePeriodDays: 5,
          lateFeeAmount: 100.00
        },
        creditor: {
          name: 'Sunset Apartments',
          phone: '555-987-6543'
        },
        category: 'housing',
        tags: ['essential', 'eviction-risk']
      },
      {
        name: 'Chase Visa Credit Card',
        type: BillType.CREDIT_CARD,
        originalAmount: 1245.67,
        currentBalance: 1270.67,
        minimumPayment: 35.00,
        interestRate: 0.2399,
        dueDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), // 17 days overdue
        isEssential: false,
        consequences: [
          {
            type: ConsequenceType.LATE_FEES,
            severity: 40,
            description: 'Late fee of $25 applied, more fees will accrue',
            estimatedDays: 0,
            preventable: false,
            recoverable: false
          },
          {
            type: ConsequenceType.CREDIT_DAMAGE,
            severity: 70,
            description: 'Payment is 30+ days late and will be reported to credit bureaus',
            estimatedDays: 13,
            preventable: true,
            recoverable: true,
            estimatedScoreDrop: 60
          }
        ],
        paymentTerms: {
          minimumPayment: 35.00,
          gracePeriodDays: 25,
          lateFeeAmount: 25.00,
          interestRate: 0.2399
        },
        creditor: {
          name: 'Chase Bank',
          phone: '800-432-3117'
        },
        category: 'credit',
        tags: ['credit-card', 'high-interest']
      },
      {
        name: 'Car Payment - Honda Civic',
        type: BillType.CAR_PAYMENT,
        originalAmount: 378.00,
        currentBalance: 378.00,
        dueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days overdue
        isEssential: true,
        consequences: [
          {
            type: ConsequenceType.REPOSSESSION,
            severity: 85,
            description: 'Vehicle repossession risk after 30 days overdue',
            estimatedDays: 18,
            preventable: true,
            recoverable: true,
            recoveryCost: 500.00
          }
        ],
        paymentTerms: {
          gracePeriodDays: 10,
          lateFeeAmount: 50.00
        },
        creditor: {
          name: 'Honda Financial Services',
          phone: '800-708-6555'
        },
        category: 'transportation',
        tags: ['essential', 'repo-risk']
      }
    ];
    
    const createdBills = [];
    for (const billData of sampleBills) {
      try {
        const result = await createBill(tableName, userId, billData);
        if (result.statusCode === 200) {
          createdBills.push(result.body ? JSON.parse(result.body).data.bill : result.data.bill);
        }
      } catch (error) {
        console.error('Error creating sample bill:', error);
      }
    }
    
    return successResponse({
      message: `Created ${createdBills.length} sample bills`,
      bills: createdBills.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    });
    
  } catch (error) {
    console.error('Load sample bills error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Extract bill ID from URL path
 */
function extractBillIdFromPath(path) {
  const match = path.match(/\/bills\/([^\/]+)/);
  return match ? match[1] : null;
}

// Export additional utilities for testing
exports.BillStatus = BillStatus;
exports.BillType = BillType;
exports.ConsequenceType = ConsequenceType;
exports.SimplePriorityCalculator = SimplePriorityCalculator;