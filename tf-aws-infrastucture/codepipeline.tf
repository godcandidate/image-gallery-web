resource "aws_s3_bucket" "artifacts" {
  bucket = lower("${var.project_name}-pipeline-artifacts")
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_codepipeline" "image_gallery" {
  name     = "${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Image"
      category         = "Source"
      owner            = "AWS"
      provider         = "ECR"
      version          = "1"
      output_artifacts = ["image_output"]

      configuration = {
        RepositoryName = "image-gallery-app"
        ImageTag       = "latest"
      }
    }

    action {
      name             = "Config"
      category         = "Source"
      owner            = "AWS"
      provider         = "S3"
      version          = "1"
      output_artifacts = ["config_output"]

      configuration = {
        S3Bucket = aws_s3_bucket.artifacts.bucket
        S3ObjectKey = "deploy.zip"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CodeDeployToECS"
      version         = "1"
      
      input_artifacts = ["image_output", "config_output"]

      configuration = {
        ApplicationName                = aws_codedeploy_app.image_gallery.name
        DeploymentGroupName           = aws_codedeploy_deployment_group.image_gallery.deployment_group_name
        TaskDefinitionTemplateArtifact = "config_output"
        TaskDefinitionTemplatePath    = "taskdef.json"
        AppSpecTemplateArtifact      = "config_output"
        AppSpecTemplatePath          = "appspec.yaml"
        Image1ArtifactName           = "image_output"
        Image1ContainerName          = "imageGallery-app"
      }
    }
  }
}

resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.project_name}-codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:DescribeImages",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService",
          "codedeploy:*"
        ]
        Resource = "*"
      }
    ]
  })
}
