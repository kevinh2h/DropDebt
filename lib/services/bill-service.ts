/**
 * DropDebt Bill Service
 * 
 * DynamoDB operations for bills with single-table design
 * Implements user data isolation and priority-based queries
 */

import { DynamoDB } from 'aws-sdk';
import {
  Bill,
  BillStatus,
  BillType,
  PriorityCalculation,
  PriorityFactors,
  DEFAULT_PRIORITY_FACTORS
} from '../types/bill-models';
import { PriorityCalculator } from '../utils/priority-calculator';

interface BillServiceConfig {
  tableName: string;
  gsiName: string;
  region?: string;
}

export class BillService {
  private dynamodb: DynamoDB.DocumentClient;
  private tableName: string;
  private gsiName: string;
  private priorityCalculator: PriorityCalculator;

  constructor(config: BillServiceConfig) {
    this.dynamodb = new DynamoDB.DocumentClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1'
    });
    this.tableName = config.tableName;
    this.gsiName = config.gsiName;
    this.priorityCalculator = new PriorityCalculator();
  }

  // ===================
  // Key Generation
  // ===================

  private generateBillKeys(userId: string, billId?: string): { PK: string; SK: string } {
    return {
      PK: `USER#${userId}`,
      SK: `BILL#${billId || this.generateBillId()}`
    };
  }

  private generatePriorityGSIKeys(userId: string, priority: number): { GSI1PK: string; GSI1SK: string } {
    return {
      GSI1PK: `USER#${userId}#PRIORITY`,
      GSI1SK: String(Math.round(priority)).padStart(6, '0')
    };
  }

  private generateBillId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractBillId(sk: string): string {
    return sk.replace('BILL#', '');
  }

  private extractUserId(pk: string): string {
    return pk.replace('USER#', '');
  }

  // ===================
  // Create Operations
  // ===================

  /**
   * Create a new bill with automatic priority calculation
   */
  async createBill(billData: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const now = new Date().toISOString();
    const keys = this.generateBillKeys(billData.userId);
    const billId = this.extractBillId(keys.SK);

    // Create initial bill object
    const bill: Bill = {
      ...billData,
      ...keys,
      billId,
      priority: 0, // Will be calculated below
      priorityCalculatedAt: now,
      createdAt: now,
      updatedAt: now,
      daysOverdue: this.calculateDaysOverdue(billData.dueDate),
      highestConsequenceSeverity: this.getHighestConsequenceSeverity(billData.consequences || []),
      GSI1PK: '', // Will be set after priority calculation
      GSI1SK: ''
    };

    // Calculate priority
    const priorityCalculation = this.priorityCalculator.calculatePriority(bill);
    bill.priority = priorityCalculation.finalScore;
    bill.priorityCalculatedAt = priorityCalculation.calculatedAt;

    // Set GSI keys for priority queries
    const gsiKeys = this.generatePriorityGSIKeys(billData.userId, bill.priority);
    bill.GSI1PK = gsiKeys.GSI1PK;
    bill.GSI1SK = gsiKeys.GSI1SK;

    // Save to DynamoDB
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: bill,
      ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
    };

    try {
      await this.dynamodb.put(params).promise();
      return bill;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Bill already exists');
      }
      throw error;
    }
  }

  // ===================
  // Read Operations
  // ===================

  /**
   * Get a specific bill by ID
   */
  async getBill(userId: string, billId: string): Promise<Bill | null> {
    const keys = this.generateBillKeys(userId, billId);

    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: keys
    };

    const result = await this.dynamodb.get(params).promise();
    return result.Item as Bill || null;
  }

  /**
   * Get all bills for a user
   */
  async getUserBills(userId: string): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk_prefix': 'BILL#'
      }
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  /**
   * Get bills sorted by priority (uses GSI1)
   */
  async getBillsByPriority(userId: string, limit?: number): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: this.gsiName,
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#${userId}#PRIORITY`
      },
      ScanIndexForward: false, // Descending order (highest priority first)
      Limit: limit
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  /**
   * Get bills by status
   */
  async getBillsByStatus(userId: string, status: BillStatus): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk_prefix': 'BILL#',
        ':status': status
      }
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  /**
   * Get overdue bills
   */
  async getOverdueBills(userId: string): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      FilterExpression: 'daysOverdue > :zero',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk_prefix': 'BILL#',
        ':zero': 0
      }
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  /**
   * Get bills with critical priority (90+)
   */
  async getCriticalBills(userId: string): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: this.gsiName,
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK >= :min_priority',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#${userId}#PRIORITY`,
        ':min_priority': '000090'
      },
      ScanIndexForward: false
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  /**
   * Get bills by type
   */
  async getBillsByType(userId: string, type: BillType): Promise<Bill[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk_prefix': 'BILL#',
        ':type': type
      }
    };

    const result = await this.dynamodb.query(params).promise();
    return result.Items as Bill[] || [];
  }

  // ===================
  // Update Operations
  // ===================

  /**
   * Update bill with automatic priority recalculation
   */
  async updateBill(userId: string, billId: string, updates: Partial<Bill>): Promise<Bill> {
    const keys = this.generateBillKeys(userId, billId);

    // First get the current bill
    const currentBill = await this.getBill(userId, billId);
    if (!currentBill) {
      throw new Error('Bill not found');
    }

    // Merge updates
    const updatedBill: Bill = {
      ...currentBill,
      ...updates,
      updatedAt: new Date().toISOString(),
      daysOverdue: updates.dueDate ? this.calculateDaysOverdue(updates.dueDate) : currentBill.daysOverdue
    };

    // Recalculate priority if priority-affecting fields changed
    if (this.shouldRecalculatePriority(updates)) {
      const priorityCalculation = this.priorityCalculator.calculatePriority(updatedBill);
      updatedBill.priority = priorityCalculation.finalScore;
      updatedBill.priorityCalculatedAt = priorityCalculation.calculatedAt;
      updatedBill.highestConsequenceSeverity = this.getHighestConsequenceSeverity(updatedBill.consequences || []);

      // Update GSI keys if priority changed
      const gsiKeys = this.generatePriorityGSIKeys(userId, updatedBill.priority);
      updatedBill.GSI1PK = gsiKeys.GSI1PK;
      updatedBill.GSI1SK = gsiKeys.GSI1SK;
    }

    // Build update expression
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add fields to update (excluding keys)
    Object.entries(updatedBill).forEach(([key, value]) => {
      if (!['PK', 'SK'].includes(key)) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: keys,
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.dynamodb.update(params).promise();
      return result.Attributes as Bill;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Bill not found');
      }
      throw error;
    }
  }

  /**
   * Update bill status
   */
  async updateBillStatus(userId: string, billId: string, status: BillStatus): Promise<Bill> {
    return this.updateBill(userId, billId, {
      status,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Mark bill as paid
   */
  async markBillAsPaid(userId: string, billId: string, paymentAmount: number, paymentDate?: string): Promise<Bill> {
    const paymentDateStr = paymentDate || new Date().toISOString();
    
    return this.updateBill(userId, billId, {
      status: BillStatus.PAID,
      lastPaymentDate: paymentDateStr,
      currentBalance: Math.max(0, await this.getBill(userId, billId).then(b => b!.currentBalance - paymentAmount)),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Recalculate priorities for all user bills
   */
  async recalculateUserPriorities(userId: string, customFactors?: PriorityFactors): Promise<Bill[]> {
    const bills = await this.getUserBills(userId);
    
    if (customFactors) {
      this.priorityCalculator.updateFactors(customFactors);
    }

    const updatedBills: Bill[] = [];

    for (const bill of bills) {
      const priorityCalculation = this.priorityCalculator.calculatePriority(bill);
      const gsiKeys = this.generatePriorityGSIKeys(userId, priorityCalculation.finalScore);

      const updatedBill = await this.updateBill(userId, bill.billId, {
        priority: priorityCalculation.finalScore,
        priorityCalculatedAt: priorityCalculation.calculatedAt,
        GSI1PK: gsiKeys.GSI1PK,
        GSI1SK: gsiKeys.GSI1SK
      });

      updatedBills.push(updatedBill);
    }

    // Reset to default factors if custom factors were used
    if (customFactors) {
      this.priorityCalculator.updateFactors(DEFAULT_PRIORITY_FACTORS);
    }

    return updatedBills.sort((a, b) => b.priority - a.priority);
  }

  // ===================
  // Delete Operations
  // ===================

  /**
   * Delete (archive) a bill
   */
  async deleteBill(userId: string, billId: string): Promise<void> {
    // Soft delete by updating status to ARCHIVED
    await this.updateBillStatus(userId, billId, BillStatus.ARCHIVED);
  }

  /**
   * Hard delete a bill (permanent removal)
   */
  async hardDeleteBill(userId: string, billId: string): Promise<void> {
    const keys = this.generateBillKeys(userId, billId);

    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.tableName,
      Key: keys,
      ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)'
    };

    try {
      await this.dynamodb.delete(params).promise();
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Bill not found');
      }
      throw error;
    }
  }

  // ===================
  // Batch Operations
  // ===================

  /**
   * Batch create bills
   */
  async batchCreateBills(bills: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>[]): Promise<Bill[]> {
    const createdBills: Bill[] = [];

    // Process in batches of 25 (DynamoDB limit)
    for (let i = 0; i < bills.length; i += 25) {
      const batch = bills.slice(i, i + 25);
      const batchResults = await Promise.all(
        batch.map(billData => this.createBill(billData))
      );
      createdBills.push(...batchResults);
    }

    return createdBills;
  }

  // ===================
  // Utility Methods
  // ===================

  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private getHighestConsequenceSeverity(consequences: any[]): number {
    if (consequences.length === 0) return 0;
    return Math.max(...consequences.map(c => c.severity || 0));
  }

  private shouldRecalculatePriority(updates: Partial<Bill>): boolean {
    const priorityFields = [
      'consequences',
      'dueDate',
      'currentBalance',
      'status',
      'paymentTerms',
      'isEssential'
    ];

    return priorityFields.some(field => updates.hasOwnProperty(field));
  }

  /**
   * Get bill statistics for user dashboard
   */
  async getBillStatistics(userId: string): Promise<{
    total: number;
    overdue: number;
    critical: number;
    totalAmount: number;
    overdueAmount: number;
    averagePriority: number;
  }> {
    const bills = await this.getUserBills(userId);
    const overdueBills = bills.filter(b => b.daysOverdue > 0);
    const criticalBills = bills.filter(b => b.priority >= 90);

    return {
      total: bills.length,
      overdue: overdueBills.length,
      critical: criticalBills.length,
      totalAmount: bills.reduce((sum, b) => sum + b.currentBalance, 0),
      overdueAmount: overdueBills.reduce((sum, b) => sum + b.currentBalance, 0),
      averagePriority: bills.length > 0 ? bills.reduce((sum, b) => sum + b.priority, 0) / bills.length : 0
    };
  }
}

// Export configured service instance
export function createBillService(config: BillServiceConfig): BillService {
  return new BillService(config);
}

// Default service factory for Lambda environment
export function createDefaultBillService(): BillService {
  const tableName = process.env.TABLE_NAME;
  const gsiName = process.env.GSI1_NAME || 'GSI1';

  if (!tableName) {
    throw new Error('TABLE_NAME environment variable is required');
  }

  return new BillService({
    tableName,
    gsiName
  });
}