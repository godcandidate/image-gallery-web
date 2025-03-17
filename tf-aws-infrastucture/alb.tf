# Application Load Balancer
resource "aws_lb" "imageGallery_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets           = aws_subnet.public[*].id

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Target Groups
resource "aws_lb_target_group" "blue-app-tg" {
  name        = "${var.project_name}-blue-app-tg"
  port        = 5173
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group" "green-app-tg" {
  name        = "${var.project_name}-green-app-tg"
  port        = 5173
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Listeners
resource "aws_lb_listener" "blue-app-lst" {
  load_balancer_arn = aws_lb.imageGallery_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue-app-tg.arn
  }
}

# Outputs
output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.imageGallery_alb.dns_name
}

output "appA_url" {
  description = "The URL for the frontend application"
  value       = "http://${aws_lb.imageGallery_alb.dns_name}"
}
