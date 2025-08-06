# DropDebt API Manual Testing Guide

**Updated:** August 5, 2025 (Post-Karen validation)  
**Infrastructure Status:** ✅ All issues resolved, ready for testing

## Quick Setup

### 1. Import Postman Files
1. **Collection:** Import `DropDebt-API.postman_collection.json`
2. **Environment:** Import `DropDebt-Environment.postman_environment.json`
3. **Select Environment:** Choose "DropDebt Development" in Postman

### 2. Required AWS Credentials
Set up AWS credentials for Postman (if testing Cognito directly):
- AWS Access Key ID: Your AWS credentials with Cognito access
- AWS Secret Access Key: Corresponding secret
- Region: `ca-central-1`

## Testing Scenarios

### Scenario 1: Infrastructure Health Check ✅

**Test:** Sample Lambda - DynamoDB Test  
**Purpose:** Verify basic infrastructure is working  
**Expected Result:** 200 response with DynamoDB read/write confirmation

```json
{
  "success": true,
  "data": {
    "message": "Sample Lambda function executed successfully",
    "testItem": {
      "PK": "TEST#sample",
      "SK": "ITEM#[timestamp]",
      "EntityType": "TestItem",
      "message": "Hello from DropDebt Lambda!"
    },
    "tableName": "dropdebt-data"
  }
}
```

### Scenario 2: Authentication Validation ✅

**Test:** Test Lambda - No Auth (401 Test)  
**Purpose:** Verify JWT authentication is required  
**Expected Result:** 401 Unauthorized

```json
{
  "success": false,
  "message": "Missing or invalid Authorization header",
  "details": null,
  "timestamp": "2025-08-05T..."
}
```

### Scenario 3: Business Logic Testing 🔐

**Prerequisites:** Valid JWT token required

#### Step 1: Get JWT Token
**Note:** Currently, user creation is admin-only. You'll need to:
1. Create a test user via AWS Console or CLI
2. Use the "Get Cognito JWT Token" request with valid credentials

#### Step 2: Test Profile Operations
**Test:** Test Lambda - Sample Profile Operation  
**Headers:** Include `Authorization: Bearer [jwt_token]`  
**Expected Result:** 200 with user profile data

#### Step 3: Test Comprehensive Operations
**Test:** Test Lambda - All Operations  
**Purpose:** Test profile + bill management with GSI queries  
**Expected Result:** Complex response with profile and bill data

## Current Infrastructure Details

### Lambda Functions
- **dropdebt-test-function:** Main business logic (✅ Working)
- **dropdebt-sample-function:** DynamoDB testing (✅ Fixed import issues)

### Authentication
- **User Pool:** `ca-central-1_kEvkxVbRv`
- **Client ID:** `48kp3qirc4cvhrpr8ag66ibg3j`
- **JWT Required:** For all business logic endpoints

### Database
- **Table:** `dropdebt-data`
- **Billing:** PAY_PER_REQUEST
- **GSI1:** Active for bill prioritization

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized
**Cause:** Missing or invalid JWT token  
**Solution:** Ensure Authorization header is set with valid Bearer token

#### 2. 500 Internal Server Error
**Cause:** Lambda function error  
**Solution:** Check CloudWatch logs for the specific function

#### 3. Network/Connection Issues
**Cause:** AWS credentials or region misconfiguration  
**Solution:** Verify environment variables and AWS profile

### Validation Commands
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name DropdebtStack --profile dd-kevin --region ca-central-1

# Test Lambda directly
aws lambda invoke --function-name dropdebt-sample-function --payload '{"test":"postman"}' --profile dd-kevin --region ca-central-1 /tmp/test.json

# Check DynamoDB table
aws dynamodb describe-table --table-name dropdebt-data --profile dd-kevin --region ca-central-1
```

## Expected Test Results Summary

| Test | Expected Status | Expected Response |
|------|----------------|-------------------|
| Sample Lambda Test | 200 | DynamoDB success message |
| No Auth Test | 401 | Missing authorization error |
| With Valid JWT | 200 | Business logic response |
| Infrastructure Health | 200 | Function metadata |

## Test User Information

**Test User ID:** `acedb598-b051-70f1-f861-eab871a259ea`  
**Email Pattern:** `test-acedb598@dropdebt.ca`  
**Note:** Actual user creation requires admin privileges

## Next Steps After Testing

1. **If all tests pass:** Infrastructure is ready for frontend integration
2. **If authentication fails:** Create test users via AWS Console
3. **If Lambda errors occur:** Check CloudWatch logs for debugging
4. **For development:** Use these endpoints as API reference for frontend

---

**Infrastructure Status:** ✅ Verified working (Karen agent validated)  
**Critical Issues:** None (All resolved)  
**Ready for:** Development team integration