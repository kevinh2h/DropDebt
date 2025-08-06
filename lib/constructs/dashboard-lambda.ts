import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DashboardLambdaProps {
  functionName: string;
  codePath: string;
  handler: string;
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
  billsLambdaArn: string;
  expensesLambdaArn: string;
  triageLambdaArn: string;
  memorySize?: number;
  timeout?: cdk.Duration;
  environment?: { [key: string]: string };
}

/**
 * DropDebt Dashboard Lambda Construct
 * 
 * Provides meaningful insights and actionable guidance by integrating
 * all core DropDebt systems. Fast, efficient, focused on user needs.
 */
export class DashboardLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: DashboardLambdaProps) {
    super(scope, id);

    // Create the Lambda function
    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      functionName: props.functionName,
      memorySize: props.memorySize || 256, // Standard memory for aggregation
      timeout: props.timeout || cdk.Duration.seconds(10), // Fast response required
      environment: {
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        DROPDEBT_REGION: cdk.Stack.of(this).region,
        BILLS_LAMBDA_FUNCTION_NAME: this.extractFunctionName(props.billsLambdaArn),
        EXPENSES_LAMBDA_FUNCTION_NAME: this.extractFunctionName(props.expensesLambdaArn),
        TRIAGE_LAMBDA_FUNCTION_NAME: this.extractFunctionName(props.triageLambdaArn),
        NODE_ENV: 'production',
        ...props.environment
      },
      description: 'DropDebt Dashboard - Meaningful insights and actionable guidance'
    });

    // Grant DynamoDB permissions for caching
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem'
      ],
      resources: [
        props.table.tableArn,
        `${props.table.tableArn}/index/*`
      ]
    }));

    // Grant permission to invoke other Lambda functions
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [
        props.billsLambdaArn,
        props.expensesLambdaArn,
        props.triageLambdaArn
      ]
    }));

    // Grant basic Cognito permissions for user context
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:GetUser',
        'cognito-idp:ListUsers'
      ],
      resources: [props.userPool.userPoolArn]
    }));

    // Add CloudWatch Logs permissions
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [`arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`]
    }));

    // Performance monitoring
    new cdk.CfnOutput(this, 'DashboardLambdaName', {
      value: this.function.functionName,
      description: 'Dashboard Lambda function name for monitoring'
    });
  }

  /**
   * Extract function name from ARN
   */
  private extractFunctionName(arn: string): string {
    const parts = arn.split(':');
    return parts[parts.length - 1];
  }
}