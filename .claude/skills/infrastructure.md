---
name: infrastructure-devops
description: Infrastructure and DevOps patterns including Docker, Docker Compose, GitHub Actions CI/CD, and deployment configurations. Use when containerizing applications, setting up CI/CD pipelines, or configuring production deployments. Triggers on Dockerfile creation, docker-compose setup, GitHub Actions workflows, multi-stage builds, or deployment automation.
---

# Infrastructure Best Practices

## Docker

### Dockerfile Best Practices

```dockerfile
# Use specific version tags, never :latest
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS builder
RUN pnpm build

# Production stage (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000 NODE_ENV=production

CMD ["node", "server.js"]
```

### Multi-stage Builds

```dockerfile
# Example: Go application
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/main ./cmd/server

# Distroless for minimal attack surface
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
EXPOSE 8080
ENTRYPOINT ["/main"]
```

### .dockerignore

```
# .dockerignore
node_modules
.next
.git
.gitignore
*.md
.env*
.DS_Store
coverage
.turbo
dist
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

### Docker Compose for Development

```yaml
# docker-compose.dev.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: base
    command: pnpm dev
    volumes:
      - .:/app
      - /app/node_modules # Prevent overwriting node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb_dev
    volumes:
      - postgres_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_dev:
```

### Health Checks

```dockerfile
# In Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
```

```typescript
// /api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    return NextResponse.json({ status: "healthy" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 },
    );
  }
}
```

---

## Terraform

### Project Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   ├── compute/
│   └── cdn/
└── shared/
    └── backend.tf
```

### Backend Configuration (Remote State)

```hcl
# shared/backend.tf
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "env/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# For initial backend setup
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mycompany-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### Module Example: VPC

```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-vpc"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-public-${count.index + 1}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-private-${count.index + 1}"
    Tier = "private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-igw"
  })
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-nat-${count.index + 1}"
  })
}

# modules/networking/variables.tf
variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Environment (dev, staging, production)"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Enable NAT Gateway for private subnets"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}

# modules/networking/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
```

### Environment Configuration

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = true

  tags = local.common_tags
}

module "database" {
  source = "../../modules/database"

  project           = var.project
  environment       = var.environment
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.private_subnet_ids
  instance_class    = "db.r6g.large"
  allocated_storage = 100

  tags = local.common_tags
}

# environments/production/variables.tf
variable "project" {
  type    = string
  default = "myapp"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
  }
}
```

### ECS Fargate Module

```hcl
# modules/compute/ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        for key, value in var.environment_variables : {
          name  = key
          value = value
        }
      ]

      secrets = [
        for key, value in var.secrets : {
          name      = key
          valueFrom = value
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://localhost:${var.container_port}/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.project}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = var.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project}-${var.environment}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### RDS Module

```hcl
# modules/database/rds.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = var.tags
}

resource "aws_db_instance" "main" {
  identifier = "${var.project}-${var.environment}"

  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.multi_az
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project}-${var.environment}-final" : null

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = var.tags
}
```

### Terraform Commands

```bash
# Initialize
terraform init

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy (careful!)
terraform destroy

# Import existing resources
terraform import aws_instance.example i-1234567890abcdef0

# State management
terraform state list
terraform state show aws_instance.example
terraform state mv aws_instance.old aws_instance.new
terraform state rm aws_instance.example

# Workspace management (alternative to environments)
terraform workspace new staging
terraform workspace select production
terraform workspace list
```

### GitHub Actions for Terraform

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths: ["terraform/**"]
  pull_request:
    branches: [main]
    paths: ["terraform/**"]

env:
  TF_VERSION: "1.6"
  AWS_REGION: "us-east-1"

jobs:
  plan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        working-directory: terraform/environments/production
        run: terraform init

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Validate
        working-directory: terraform/environments/production
        run: terraform validate

      - name: Terraform Plan
        id: plan
        working-directory: terraform/environments/production
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan 📖
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        working-directory: terraform/environments/production
        run: terraform init

      - name: Terraform Apply
        working-directory: terraform/environments/production
        run: terraform apply -auto-approve
```

---

## Best Practices Summary

### Docker

1. **Multi-stage builds** - Smaller, more secure images
2. **Specific base image tags** - Never use `:latest`
3. **Non-root user** - Run containers as non-root
4. **Health checks** - Proper container health monitoring
5. **.dockerignore** - Exclude unnecessary files
6. **Layer caching** - Order Dockerfile instructions wisely
7. **Distroless/Alpine** - Minimal base images

### Terraform

1. **Remote state** - S3 + DynamoDB for locking
2. **Modules** - Reusable, versioned components
3. **Environments** - Separate state per environment
4. **Variables + Locals** - Parameterize everything
5. **Outputs** - Export values for other modules
6. **Lifecycle rules** - Prevent accidental destruction
7. **Tags** - Consistent resource tagging
8. **CI/CD** - Automated plan and apply
9. **State locking** - Prevent concurrent modifications
10. **Secrets management** - Use AWS Secrets Manager/SSM
