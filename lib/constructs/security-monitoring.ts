import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface SecurityMonitoringProps {
  /**
   * Lambda functions to monitor for security events
   */
  lambdaFunctions: lambda.Function[];
  
  /**
   * CloudWatch log retention period for security logs
   * @default 30 days
   */
  logRetentionDays?: logs.RetentionDays;
}

/**
 * Security monitoring construct for DropDebt Lambda functions
 * Provides basic CloudWatch monitoring and alerting for security events
 */
export class SecurityMonitoring extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  
  constructor(scope: Construct, id: string, props: SecurityMonitoringProps) {
    super(scope, id);

    const logRetention = props.logRetentionDays || logs.RetentionDays.ONE_MONTH;

    // Create security dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: 'DropDebt-Security-Monitor',
      widgets: [
        [
          // Authentication failures
          new cloudwatch.GraphWidget({
            title: 'Authentication Failures',
            left: this.createAuthFailureMetrics(props.lambdaFunctions),
            width: 12,
            height: 6
          }),
          
          // Lambda errors
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Errors',
            left: this.createLambdaErrorMetrics(props.lambdaFunctions),
            width: 12,
            height: 6
          })
        ],
        [
          // JWT validation metrics
          new cloudwatch.GraphWidget({
            title: 'JWT Token Validation',
            left: this.createJwtMetrics(props.lambdaFunctions),
            width: 12,
            height: 6
          }),
          
          // DynamoDB access patterns
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Access Patterns',
            left: this.createDynamoDbMetrics(props.lambdaFunctions),
            width: 12,
            height: 6
          })
        ]
      ]
    });

    // Create metric filters for security events
    this.createSecurityMetricFilters(props.lambdaFunctions);

    // Add tags for resource management
    cdk.Tags.of(this).add('Project', 'DropDebt');
    cdk.Tags.of(this).add('Component', 'Security');
    cdk.Tags.of(this).add('Environment', 'Development');
  }

  private createAuthFailureMetrics(lambdaFunctions: lambda.Function[]): cloudwatch.Metric[] {
    return lambdaFunctions.map(func => 
      new cloudwatch.Metric({
        namespace: 'DropDebt/Security',
        metricName: 'AuthenticationFailures',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      })
    );
  }

  private createLambdaErrorMetrics(lambdaFunctions: lambda.Function[]): cloudwatch.Metric[] {
    return lambdaFunctions.map(func => func.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    }));
  }

  private createJwtMetrics(lambdaFunctions: lambda.Function[]): cloudwatch.Metric[] {
    return lambdaFunctions.map(func => 
      new cloudwatch.Metric({
        namespace: 'DropDebt/Security',
        metricName: 'JWTValidationFailures',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      })
    );
  }

  private createDynamoDbMetrics(lambdaFunctions: lambda.Function[]): cloudwatch.Metric[] {
    return lambdaFunctions.map(func => 
      new cloudwatch.Metric({
        namespace: 'DropDebt/Security',
        metricName: 'DynamoDBAccessDenied',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      })
    );
  }

  private createSecurityMetricFilters(lambdaFunctions: lambda.Function[]) {
    // Create metric filters that will work with existing Lambda log groups
    // Note: Metric filters will be created but may not work until log groups are created by Lambda execution
    
    lambdaFunctions.forEach((func, index) => {
      // Reference existing log groups (created automatically by Lambda)
      const logGroup = logs.LogGroup.fromLogGroupName(
        this, 
        `ExistingLogGroup${index}`, 
        `/aws/lambda/${func.functionName}`
      );

      // Authentication failure filter - simple pattern for reliability
      new logs.MetricFilter(this, `AuthFailureFilter${index}`, {
        logGroup: logGroup,
        metricNamespace: 'DropDebt/Security',
        metricName: 'AuthenticationFailures',
        filterPattern: logs.FilterPattern.stringValue('$.success', '=', 'false'),
        metricValue: '1',
        defaultValue: 0
      });

      // DynamoDB access denied filter
      new logs.MetricFilter(this, `DynamoAccessFilter${index}`, {
        logGroup: logGroup,
        metricNamespace: 'DropDebt/Security',
        metricName: 'DynamoDBAccessDenied',
        filterPattern: logs.FilterPattern.anyTerm('AccessDeniedException', 'not authorized to perform'),
        metricValue: '1',
        defaultValue: 0
      });
    });
  }
}