#!/bin/bash

# Video Proctoring System Setup Script
# This script sets up the entire project environment

echo "🚀 Setting up Video Proctoring System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Install database dependencies
echo "📦 Installing database dependencies..."
cd database
npm install
cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p server/uploads

# Create models directory
echo "📁 Creating models directory..."
mkdir -p client/public/models

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f server/.env ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env from template"
    echo "⚠️  Please update server/.env with your MySQL credentials"
fi

if [ ! -f client/.env ]; then
    echo "REACT_APP_API_URL=http://localhost:5000" > client/.env
    echo "✅ Created client/.env"
fi

# Setup database
echo "🗄️  Setting up database..."
cd database
node setup.js
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your MySQL credentials"
echo "2. Start MySQL service"
echo "3. Run 'npm run dev' to start the application"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🔑 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📚 For more information, see README.md"
