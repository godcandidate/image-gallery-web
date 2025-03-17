//Global variables

variable "project_name"{
    description = "The name of the project"
    type        = string
    default     = "imageGallery"
}

variable "aws_region" {    
  description = "The ID of the VPC"
  type        = string
  default       = "eu-west-1"
}
 
variable "aws_access_key_id" {
  description = "The AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "The AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for the LampStack VPC"
  type        = string
  default     = "172.16.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR blocks for the LampStack public subnets"
  type        = list(string)
  default     = ["172.16.1.0/24", "172.16.2.0/24"]
}


variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b"]
}

//Security group variables
variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

//ECS Variables
variable "ecr_image_galley-app_uri" {
  description = "The URI of the ECR Image Gallery App"
  type        = string
  sensitive   = true
  
}



