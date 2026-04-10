#!/bin/bash
# Installation script for Grepolis separated project

echo "🏛️ Grepolis - Installing dependencies..."

echo ""
echo "📦 Installing root dependencies..."
npm install

echo ""
echo "📦 Installing Backend dependencies..."
cd Backend
npm install
cd ..

echo ""
echo "📦 Installing Frontend dependencies..."
cd Frontend
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy .env.example to .env in both Backend and Frontend folders"
echo "2. Update the environment variables with your configuration"
echo "3. Run database migrations: cd Backend && npm run db:push"
echo "4. Start both applications: npm run dev"
echo ""
echo "📚 See README.md for more information"
