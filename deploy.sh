#!/bin/bash
set -e

REGION="ap-south-1"
FUNCTION_NAME="tripcraft-api"
ROLE_NAME="tripcraft-lambda-role"
S3_BUCKET="tripcraft-frontend-$(date +%s)"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== TripCraft AWS Serverless Deployment ==="
echo "Account: $ACCOUNT_ID | Region: $REGION"

# ---- Step 1: Create Lambda execution role ----
echo ""
echo ">>> Step 1: Creating Lambda IAM Role..."
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document "$TRUST_POLICY" \
  --region $REGION 2>/dev/null || echo "Role already exists"

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "Role ARN: $ROLE_ARN"
echo "Waiting 10s for role propagation..."
sleep 10

# ---- Step 2: Package backend for Lambda ----
echo ""
echo ">>> Step 2: Packaging backend..."
cd backend
rm -f lambda-deploy.zip
zip -r lambda-deploy.zip . -x "node_modules/.cache/*" ".env" "*.zip" 2>/dev/null
echo "Package size: $(du -h lambda-deploy.zip | cut -f1)"
cd ..

# ---- Step 3: Create/Update Lambda Function ----
echo ""
echo ">>> Step 3: Deploying Lambda Function..."

# Read env vars from backend/.env
MONGODB_URI=$(grep MONGODB_URI backend/.env | cut -d= -f2-)
JWT_SECRET=$(grep JWT_SECRET backend/.env | cut -d= -f2-)
JWT_EXPIRE=$(grep JWT_EXPIRE backend/.env | cut -d= -f2-)
CLOUDINARY_CLOUD_NAME=$(grep CLOUDINARY_CLOUD_NAME backend/.env | cut -d= -f2-)
CLOUDINARY_API_KEY=$(grep CLOUDINARY_API_KEY backend/.env | cut -d= -f2-)
CLOUDINARY_API_SECRET=$(grep CLOUDINARY_API_SECRET backend/.env | cut -d= -f2-)
GROQ_API_KEY=$(grep GROQ_API_KEY backend/.env | cut -d= -f2-)

ENV_VARS="{\"Variables\":{\"MONGODB_URI\":\"$MONGODB_URI\",\"JWT_SECRET\":\"$JWT_SECRET\",\"JWT_EXPIRE\":\"$JWT_EXPIRE\",\"CLOUDINARY_CLOUD_NAME\":\"$CLOUDINARY_CLOUD_NAME\",\"CLOUDINARY_API_KEY\":\"$CLOUDINARY_API_KEY\",\"CLOUDINARY_API_SECRET\":\"$CLOUDINARY_API_SECRET\",\"GROQ_API_KEY\":\"$GROQ_API_KEY\",\"NODE_ENV\":\"production\"}}"

# Try update first, create if it doesn't exist
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://backend/lambda-deploy.zip \
  --region $REGION 2>/dev/null && \
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --environment "$ENV_VARS" \
  --timeout 30 \
  --memory-size 512 \
  --region $REGION 2>/dev/null || \
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler lambda.handler \
  --zip-file fileb://backend/lambda-deploy.zip \
  --environment "$ENV_VARS" \
  --timeout 30 \
  --memory-size 512 \
  --region $REGION

echo "Lambda deployed!"

# ---- Step 4: Create API Gateway (Function URL) ----
echo ""
echo ">>> Step 4: Creating Lambda Function URL..."
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region $REGION 2>/dev/null || true

FUNC_URL=$(aws lambda create-function-url-config \
  --function-name $FUNCTION_NAME \
  --auth-type NONE \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["*"]}' \
  --region $REGION \
  --query FunctionUrl --output text 2>/dev/null || \
aws lambda get-function-url-config \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query FunctionUrl --output text)

echo "API URL: $FUNC_URL"

# ---- Step 5: Build & Deploy Frontend to S3 ----
echo ""
echo ">>> Step 5: Building frontend..."
cd frontend

# Set API URL to Lambda function URL
API_URL="${FUNC_URL}api"
echo "VITE_API_URL=${API_URL}" > .env.production

npm run build
cd ..

echo ""
echo ">>> Step 6: Creating S3 bucket & uploading..."
aws s3 mb s3://$S3_BUCKET --region $REGION 2>/dev/null || true

aws s3 website s3://$S3_BUCKET \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public access
BUCKET_POLICY="{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicRead\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::${S3_BUCKET}/*\"}]}"

aws s3api put-public-access-block \
  --bucket $S3_BUCKET \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --region $REGION

aws s3api put-bucket-policy \
  --bucket $S3_BUCKET \
  --policy "$BUCKET_POLICY" \
  --region $REGION

aws s3 sync frontend/dist s3://$S3_BUCKET --delete

FRONTEND_URL="http://${S3_BUCKET}.s3-website.${REGION}.amazonaws.com"

# ---- Done ----
echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE!"
echo "============================================"
echo "  Backend API:  $FUNC_URL"
echo "  Frontend:     $FRONTEND_URL"
echo "============================================"
