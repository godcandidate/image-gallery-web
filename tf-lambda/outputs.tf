# Output the Lambda function URL
output "lambda_function_url" {
  description = "URL endpoint for the Lambda function"
  value       = aws_lambda_function_url.image_gallery_url.function_url
}

# Output the Lambda function name
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.image_gallery_lambda.function_name
}

# Output the Lambda function ARN
output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.image_gallery_lambda.arn
}
