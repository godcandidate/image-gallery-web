# Image Gallery Lambda Deployment

This directory contains the Terraform configuration to deploy the Image Gallery API as an AWS Lambda function with X-Ray tracing, S3 integration, and a public function URL.

## Prerequisites

- AWS CLI configured with your credentials
- Terraform installed
- Node.js and npm installed

## Deployment Steps

1. **Create the X-Ray SDK Layer**:
   ```bash
   ./create-xray-layer.sh
   ```
   This will create the `xray-layer.zip` file needed for the Lambda deployment.

2. **Configure your deployment**:
   Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your AWS credentials and S3 bucket name:
   ```
   # AWS credentials
   aws_region     = "eu-west-1"
   aws_access_key = "YOUR_AWS_ACCESS_KEY"
   aws_secret_key = "YOUR_AWS_SECRET_ACCESS_KEY"
   
   # S3 bucket configuration
   s3_bucket_name = "your-s3-bucket-name"
   ```

3. **Deploy the Lambda function**:
   ```bash
   terraform init
   terraform apply
   ```

4. **Get the Lambda Function URL**:
   After deployment, Terraform will output the Lambda function URL. Use this URL in your frontend application.

## Frontend Integration

1. **Update your `.env` file** to include the Lambda Function URL:
   ```
   VITE_LAMBDA_FUNCTION_URL=https://your-lambda-function-url.lambda-url.eu-west-1.on.aws
   ```

2. **The S3 service has been updated** to use the Lambda function URL for all operations (list, upload, delete).

## Testing the Deployment

1. After deploying the Lambda function, run your frontend application:
   ```bash
   cd ..
   npm run dev
   ```

2. Upload an image and verify that it's processed through the Lambda function.

3. Check AWS CloudWatch Logs and X-Ray traces to monitor the Lambda function execution.

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, verify that the Lambda function has the correct CORS headers in the response.
- **Lambda Errors**: Check CloudWatch Logs for any errors in the Lambda function execution.
- **X-Ray Tracing**: View X-Ray traces in the AWS Console to diagnose performance issues.
