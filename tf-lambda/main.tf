provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_execution_role" {
  name = "image_gallery_lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach policies to the Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach X-Ray permissions
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
}

# S3 access policy
resource "aws_iam_policy" "s3_access" {
  name        = "image_gallery_s3_access"
  description = "Allow access to the image gallery S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Create a directory for Lambda deployment files
resource "local_file" "lambda_package_json" {
  content  = jsonencode({
    name = "image-gallery-lambda"
    version = "1.0.0"
    description = "Lambda function for image gallery API"
    main = "lambda-handler.js"
    dependencies = {
      "aws-xray-sdk" = "^3.5.0"
      "@aws-sdk/client-s3" = "^3.400.0"
    }
  })
  filename = "${path.module}/lambda-deploy/package.json"
}

# Copy the Lambda handler to the deployment directory
resource "local_file" "lambda_handler" {
  content  = file("${path.module}/lambda-handler.js")
  filename = "${path.module}/lambda-deploy/lambda-handler.js"
  depends_on = [local_file.lambda_package_json]
}

# Create a zip file for the Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-deploy"
  output_path = "${path.module}/lambda-function.zip"
  depends_on  = [local_file.lambda_handler, local_file.lambda_package_json]
}

# Install dependencies for Lambda
resource "null_resource" "install_dependencies" {
  triggers = {
    package_json = local_file.lambda_package_json.content
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/lambda-deploy && npm install --production"
  }

  depends_on = [local_file.lambda_package_json, local_file.lambda_handler]
}

# Lambda function
resource "aws_lambda_function" "image_gallery_lambda" {
  function_name    = "image-gallery-api"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda-handler.handler"
  runtime          = "nodejs18.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 30
  memory_size      = 512
  
  # Enable X-Ray tracing
  tracing_config {
    mode = "Active"
  }
  
  # Environment variables
  environment {
    variables = {
      VITE_AWS_REGION            = var.aws_region
      VITE_AWS_BUCKET_NAME       = var.s3_bucket_name
      VITE_AWS_ACCESS_KEY_ID     = var.aws_access_key
      VITE_AWS_SECRET_ACCESS_KEY = var.aws_secret_key
    }
  }

  # Add dependencies
  depends_on = [
    data.archive_file.lambda_zip,
    null_resource.install_dependencies
  ]

  # Add the X-Ray SDK layer if it exists
  layers = fileexists("${path.module}/xray-layer.zip") ? [aws_lambda_layer_version.xray_sdk_layer[0].arn] : []
}

# Function URL for public access
resource "aws_lambda_function_url" "image_gallery_url" {
  function_name      = aws_lambda_function.image_gallery_lambda.function_name
  authorization_type = "NONE"
  
  # Disable AWS-level CORS since we're handling it in the code
  # This prevents duplicate CORS headers
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "image_gallery_logs" {
  name              = "/aws/lambda/${aws_lambda_function.image_gallery_lambda.function_name}"
  retention_in_days = 7
}

# Layer for AWS X-Ray SDK
resource "aws_lambda_layer_version" "xray_sdk_layer" {
  layer_name = "xray-sdk-layer"
  
  compatible_runtimes = ["nodejs18.x"]
  
  filename = "${path.module}/xray-layer.zip"
  source_code_hash = filebase64sha256("${path.module}/xray-layer.zip")
  
  # Skip creation if the file doesn't exist yet
  count = fileexists("${path.module}/xray-layer.zip") ? 1 : 0
}
