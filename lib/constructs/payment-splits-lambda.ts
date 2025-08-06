import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface PaymentSplitsLambdaProps {
  functionName: string;
  codePath: string;
  handler: string;
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
  billsLambdaArn: string;
  expensesLambdaArn: string;
  memorySize?: number;
  timeout?: cdk.Duration;
  environment?: { [key: string]: string };
}

/**
 * DropDebt Crisis Triage Lambda Construct
 * 
 * Provides immediate crisis guidance for users with financial emergencies.
 * Integrates with Bills and Essential Needs systems for triage assessment.
 */
export class PaymentSplitsLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: PaymentSplitsLambdaProps) {
    super(scope, id);

    // Create the Lambda function
    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      functionName: props.functionName,
      memorySize: props.memorySize || 256, // Standard memory for crisis triage
      timeout: props.timeout || cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        DROPDEBT_REGION: cdk.Stack.of(this).region,
        BILLS_LAMBDA_FUNCTION_NAME: this.extractFunctionName(props.billsLambdaArn),
        EXPENSES_LAMBDA_FUNCTION_NAME: this.extractFunctionName(props.expensesLambdaArn),
        NODE_ENV: 'production',
        ...props.environment
      },
      description: 'DropDebt Crisis Triage System - Emergency Financial Guidance'
    });

    // Grant DynamoDB permissions with least privilege
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query',
        'dynamodb:DeleteItem'
      ],
      resources: [
        props.table.tableArn,
        `${props.table.tableArn}/index/*` // GSI access
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

    // Grant Lambda invoke permissions to call Bills and Essential Needs Lambdas
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction'
      ],
      resources: [
        props.billsLambdaArn,
        props.expensesLambdaArn
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

    // Add tags for organization and cost tracking
    cdk.Tags.of(this.function).add('Project', 'DropDebt');
    cdk.Tags.of(this.function).add('Component', 'PaymentSplitting');
    cdk.Tags.of(this.function).add('Feature', 'CashFlowOptimization');
    cdk.Tags.of(this.function).add('Purpose', 'PaymentPlanManagement');
  }

  /**
   * Extract function name from ARN for environment variable
   */
  private extractFunctionName(functionArn: string): string {
    const parts = functionArn.split(':');
    return parts[parts.length - 1];
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