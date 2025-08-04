import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  TransactWriteCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  DynamoDbItem, 
  PaginatedResponse, 
  PaginationParams,
  EntityTypes,
  User, 
  Bill, 
  Expense, 
  PaymentArrangement 
} from '../types';

export class DynamoDbService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName?: string) {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName || process.env.DYNAMODB_TABLE_NAME || 'dropdebt-data';
  }

  // ===== GENERIC CRUD OPERATIONS =====

  async getItem<T extends DynamoDbItem>(PK: string, SK: string): Promise<T | null> {
    try {
      const result = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { PK, SK }
      }));
      return result.Item as T || null;
    } catch (error) {
      console.error('DynamoDB GetItem error:', error);
      throw new Error(`Failed to get item: ${PK}#${SK}`);
    }
  }

  async putItem<T extends DynamoDbItem>(item: T): Promise<T> {
    try {
      const timestamp = new Date().toISOString();
      const itemWithTimestamp = {
        ...item,
        UpdatedAt: timestamp,
        CreatedAt: item.CreatedAt || timestamp
      };

      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: itemWithTimestamp
      }));
      return itemWithTimestamp;
    } catch (error) {
      console.error('DynamoDB PutItem error:', error);
      throw new Error('Failed to save item');
    }
  }

  async updateItem<T extends DynamoDbItem>(
    PK: string, 
    SK: string, 
    updates: Partial<T>,
    conditions?: string
  ): Promise<T> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Add timestamp
      updates.UpdatedAt = new Date().toISOString();

      // Build update expression
      Object.entries(updates).forEach(([key, value], index) => {
        if (value !== undefined) {
          const nameKey = `#attr${index}`;
          const valueKey = `:val${index}`;
          updateExpression.push(`${nameKey} = ${valueKey}`);
          expressionAttributeNames[nameKey] = key;
          expressionAttributeValues[valueKey] = value;
        }
      });

      const result = await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { PK, SK },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: conditions,
        ReturnValues: 'ALL_NEW'
      }));

      return result.Attributes as T;
    } catch (error) {
      console.error('DynamoDB UpdateItem error:', error);
      throw new Error(`Failed to update item: ${PK}#${SK}`);
    }
  }

  async deleteItem(PK: string, SK: string): Promise<void> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { PK, SK }
      }));
    } catch (error) {
      console.error('DynamoDB DeleteItem error:', error);
      throw new Error(`Failed to delete item: ${PK}#${SK}`);
    }
  }

  async query<T extends DynamoDbItem>(
    keyCondition: string,
    params: {
      indexName?: string;
      filterExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, any>;
      scanIndexForward?: boolean;
      limit?: number;
      exclusiveStartKey?: Record<string, any>;
    } = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const result = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: params.indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: params.filterExpression,
        ExpressionAttributeNames: params.expressionAttributeNames,
        ExpressionAttributeValues: params.expressionAttributeValues,
        ScanIndexForward: params.scanIndexForward,
        Limit: params.limit,
        ExclusiveStartKey: params.exclusiveStartKey
      }));

      return {
        items: result.Items as T[] || [],
        count: result.Count || 0,
        nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (error) {
      console.error('DynamoDB Query error:', error);
      throw new Error('Failed to query items');
    }
  }

  // ===== USER OPERATIONS =====

  async getUser(userId: string): Promise<User | null> {
    const item = await this.getItem(`USER#${userId}`, 'PROFILE');
    return item ? this.dynamoToUser(item) : null;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const timestamp = new Date().toISOString();
    const dynamoItem = {
      PK: `USER#${userData.userId}`,
      SK: 'PROFILE',
      EntityType: EntityTypes.USER,
      GSI1PK: `USER#${userData.userId}`,
      GSI1SK: 'PROFILE',
      UserId: userData.userId,
      Email: userData.email,
      FirstName: userData.firstName,
      LastName: userData.lastName,
      Phone: userData.phone,
      PreferredPaymentMethod: userData.preferredPaymentMethod,
      TotalMonthlyIncome: userData.totalMonthlyIncome,
      CreatedAt: timestamp,
      UpdatedAt: timestamp
    };

    await this.putItem(dynamoItem);
    return this.dynamoToUser(dynamoItem);
  }

  // ===== BILL OPERATIONS =====

  async getBillsByPriority(userId: string, limit?: number): Promise<Bill[]> {
    const result = await this.query<any>(
      'GSI1PK = :gsi1pk',
      {
        indexName: 'GSI1',
        expressionAttributeValues: {
          ':gsi1pk': `BILLS_BY_PRIORITY#${userId}`
        },
        scanIndexForward: false, // Highest priority first
        limit
      }
    );

    return result.items.map(item => this.dynamoToBill(item));
  }

  async getUserBills(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Bill>> {
    const result = await this.query<any>(
      'PK = :pk AND begins_with(SK, :sk)',
      {
        expressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'BILL#'
        },
        limit: pagination?.limit,
        exclusiveStartKey: pagination?.nextToken ? JSON.parse(pagination.nextToken) : undefined
      }
    );

    return {
      ...result,
      items: result.items.map(item => this.dynamoToBill(item))
    };
  }

  async createBill(userId: string, billData: Omit<Bill, 'billId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const dynamoItem = {
      PK: `USER#${userId}`,
      SK: `BILL#${billId}`,
      EntityType: EntityTypes.BILL,
      GSI1PK: `BILLS_BY_PRIORITY#${userId}`,
      GSI1SK: `${String(billData.priorityScore).padStart(3, '0')}#${billData.dueDate}#${billId}`,
      BillId: billId,
      UserId: userId,
      BillName: billData.billName,
      Amount: billData.amount,
      DueDate: billData.dueDate,
      PriorityScore: billData.priorityScore,
      Category: billData.category,
      IsEssential: billData.isEssential,
      Status: billData.status,
      MinimumPayment: billData.minimumPayment,
      InterestRate: billData.interestRate,
      LateFee: billData.lateFee,
      Description: billData.description,
      CreatedAt: timestamp,
      UpdatedAt: timestamp
    };

    await this.putItem(dynamoItem);
    return this.dynamoToBill(dynamoItem);
  }

  // ===== BATCH OPERATIONS =====

  async batchGetItems<T extends DynamoDbItem>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    try {
      const result = await this.client.send(new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys
          }
        }
      }));

      return result.Responses?.[this.tableName] as T[] || [];
    } catch (error) {
      console.error('DynamoDB BatchGet error:', error);
      throw new Error('Failed to batch get items');
    }
  }

  async transactWrite(items: Array<{
    type: 'put' | 'update' | 'delete';
    item?: DynamoDbItem;
    key?: { PK: string; SK: string };
    updates?: Record<string, any>;
    conditions?: string;
  }>): Promise<void> {
    try {
      const transactItems = items.map(item => {
        switch (item.type) {
          case 'put':
            return {
              Put: {
                TableName: this.tableName,
                Item: item.item
              }
            };
          case 'delete':
            return {
              Delete: {
                TableName: this.tableName,
                Key: item.key
              }
            };
          default:
            throw new Error(`Unsupported transaction type: ${item.type}`);
        }
      });

      await this.client.send(new TransactWriteCommand({
        TransactItems: transactItems
      }));
    } catch (error) {
      console.error('DynamoDB TransactWrite error:', error);
      throw new Error('Failed to execute transaction');
    }
  }

  // ===== CONVERSION METHODS =====

  private dynamoToUser(item: any): User {
    return {
      userId: item.UserId,
      email: item.Email,
      firstName: item.FirstName,
      lastName: item.LastName,
      phone: item.Phone,
      preferredPaymentMethod: item.PreferredPaymentMethod,
      totalMonthlyIncome: item.TotalMonthlyIncome,
      createdAt: item.CreatedAt,
      updatedAt: item.UpdatedAt
    };
  }

  private dynamoToBill(item: any): Bill {
    return {
      billId: item.BillId,
      userId: item.UserId,
      billName: item.BillName,
      amount: item.Amount,
      dueDate: item.DueDate,
      priorityScore: item.PriorityScore,
      category: item.Category,
      isEssential: item.IsEssential,
      status: item.Status,
      minimumPayment: item.MinimumPayment,
      interestRate: item.InterestRate,
      lateFee: item.LateFee,
      description: item.Description,
      creditorName: item.CreditorName,
      accountNumber: item.AccountNumber,
      createdAt: item.CreatedAt,
      updatedAt: item.UpdatedAt
    };
  }
}