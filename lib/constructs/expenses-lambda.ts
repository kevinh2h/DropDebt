import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ExpensesLambdaProps {
  functionName: string;
  codePath: string;
  handler: string;
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
  memorySize?: number;
  timeout?: cdk.Duration;
  environment?: { [key: string]: string };
}

/**
 * DropDebt Essential Expenses Management Lambda Construct
 * 
 * Manages essential living expenses and budget safety validation
 * Prevents users from making financially dangerous payment decisions
 */
export class ExpensesLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: ExpensesLambdaProps) {
    super(scope, id);

    // Create the Lambda function
    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      functionName: props.functionName,
      memorySize: props.memorySize || 256, // Modest memory for essential calculations
      timeout: props.timeout || cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        DROPDEBT_REGION: cdk.Stack.of(this).region,
        NODE_ENV: 'production',
        ...props.environment
      },
      description: 'DropDebt Essential Expenses Management with Budget Safety Protection'
    });

    // Grant DynamoDB permissions with least privilege
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query'
      ],
      resources: [
        props.table.tableArn,
        `${props.table.tableArn}/index/*` // GSI access if needed
      ]
    }));

    // Grant Cognito permissions for JWT validation
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:GetUser',
        'cognito-idp:DescribeUserPool'
      ],
      resources: [props.userPool.userPoolArn]
    }));

    // Grant Lambda invoke permissions to call Bills Lambda
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction'
      ],
      resources: [
        `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:function:dropdebt-bills-function`
      ]
    }));

    // X-Ray permissions for tracing - account-scoped for security
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords'
      ],
      resources: [`arn:aws:xray:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`]
    }));

    // CloudWatch Logs permissions
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [`arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/aws/lambda/${props.functionName}:*`]
    }));

    // Add tags
    cdk.Tags.of(this.function).add('Project', 'DropDebt');
    cdk.Tags.of(this.function).add('Component', 'ExpensesManagement');
    cdk.Tags.of(this.function).add('Feature', 'BudgetSafety');
    cdk.Tags.of(this.function).add('Purpose', 'EssentialNeedsProtection');
  }

  /**
   * Grant invoke permissions to the function
   */
  public grantInvoke(grantee: iam.IGrantable): iam.Grant {
    return this.function.grantInvoke(grantee);
  }

  /**
   * Add environment variables to the function
   */
  public addEnvironment(key: string, value: string): void {
    this.function.addEnvironment(key, value);
  }

  /**
   * Add IAM policy statements to the function's role
   */
  public addToRolePolicy(statement: iam.PolicyStatement): void {
    this.function.addToRolePolicy(statement);
  }
}