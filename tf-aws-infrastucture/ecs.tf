# ECS Cluster
resource "aws_ecs_cluster" "image_gallery_cluster" {
  name = "${var.project_name}-cluster"
}

# Task Definitions
resource "aws_ecs_task_definition" "app_task_definition" {
  family                   = "${var.project_name}-app-td"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = 256
  memory                  = 512
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-app"
      image = var.ecr_image_galley-app_uri
      portMappings = [
        {
          containerPort = 5173
          hostPort      = 80
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "VITE_AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "VITE_AWS_ACCESS_KEY_ID"
          value = var.aws_access_key_id
        },
        {
          name  = "VITE_AWS_SECRET_ACCESS_KEY"
          value = var.aws_secret_access_key
        },
        {
          name  = "VITE_AWS_BUCKET_NAME"
          value = var.aws_bucket_name
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}-app"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ECS Services
resource "aws_ecs_service" "app_ecs_service" {
  name            = "${var.project_name}-app-service"
  cluster         = aws_ecs_cluster.image_gallery_cluster.id
  task_definition = aws_ecs_task_definition.app_task_definition.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.appA.arn
    container_name   = "${var.project_name}-app"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.appA]
}


# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "image_gallery_app" {
  name              = "/ecs/${var.project_name}-app"
  retention_in_days = 7
}


