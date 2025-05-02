#!/bin/bash
# Script to create an AWS Lambda layer with the AWS X-Ray SDK for Node.js

# Create a temporary directory for the layer
mkdir -p lambda-layer/nodejs

# Navigate to the layer directory
cd lambda-layer/nodejs

# Initialize a package.json file
npm init -y

# Install the AWS X-Ray SDK
npm install aws-xray-sdk

# Go back to the parent directory
cd ../..

# Create a ZIP file of the layer
zip -r xray-layer.zip lambda-layer

# Clean up
rm -rf lambda-layer

echo "X-Ray SDK layer has been created as xray-layer.zip"
