import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { 
  successResponse, 
  errorResponse, 
  getEnvironmentVariable 
} from '../../shared/utils';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tableName = getEnvironmentVariable('TABLE_NAME');
    
    // Sample operation - put and get a test item
    const testItem = {
      PK: 'TEST#sample',
      SK: 'ITEM#' + Date.now(),
      EntityType: 'TestItem',
      message: 'Hello from DropDebt Lambda!',
      timestamp: new Date().toISOString()
    };

    // Put test item
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: testItem
    }));

    // Get test item back
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: {
        PK: testItem.PK,
        SK: testItem.SK
      }
    }));

    return successResponse({
      message: 'Sample Lambda function executed successfully',
      testItem: result.Item,
      tableName,
      event: {
        httpMethod: event.httpMethod,
        path: event.path
      }
    });

  } catch (error) {
    console.error('Error in sample Lambda:', error);
    return errorResponse(error as string);
  }
};