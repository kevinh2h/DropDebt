import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BillsLambdaProps {
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
 * DropDebt Bills Management Lambda Construct
 * 
 * Implements comprehensive bill CRUD operations with consequence-based prioritization
 * Supports the Catch-Up Prioritization Matrix with authentication and user isolation
 */
export class BillsLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: BillsLambdaProps) {
    super(scope, id);

    // Create the Lambda function
    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      functionName: props.functionName,
      memorySize: props.memorySize || 512, // Higher memory for bill calculations
      timeout: props.timeout || cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        DROPDEBT_REGION: cdk.Stack.of(this).region,
        NODE_ENV: 'production',
        ...props.environment
      },
      description: 'DropDebt Bills Management with Consequence-Based Prioritization'
    });

    // Grant DynamoDB permissions with least privilege
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
        `${props.table.tableArn}/index/*` // GSI access for priority queries
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

    // Enable X-Ray tracing (tracing is enabled by default in Lambda runtime)

    // Add tags
    cdk.Tags.of(this.function).add('Project', 'DropDebt');
    cdk.Tags.of(this.function).add('Component', 'BillsManagement');
    cdk.Tags.of(this.function).add('Feature', 'PriorityCalculation');
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