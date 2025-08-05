import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface SimpleLambdaProps {
  functionName: string;
  codePath: string;
  handler: string;
  table?: dynamodb.ITable;
  timeout?: cdk.Duration;
  memorySize?: number;
}

export class SimpleLambda extends Construct {
  public readonly function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: SimpleLambdaProps) {
    super(scope, id);
    
    this.function = new lambda.Function(this, 'Function', {
      functionName: props.functionName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      timeout: props.timeout || cdk.Duration.seconds(30),
      memorySize: props.memorySize || 256,
      environment: props.table ? { 
        TABLE_NAME: props.table.tableName,
        REGION: cdk.Stack.of(this).region
      } : {}
    });
    
    if (props.table) {
      // Use least-privilege access with proper resource scoping
      // User data isolation enforced at application level due to GSI compatibility requirements
      this.function.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem', 
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query'
        ],
        resources: [
          props.table.tableArn,
          `${props.table.tableArn}/index/*`
        ]
      }));
    }
  }
}