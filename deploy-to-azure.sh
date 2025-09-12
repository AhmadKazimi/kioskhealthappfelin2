#!/bin/bash

echo "🚀 Azure FTP Deployment Script"
echo "=============================="

# Azure FTP Configuration
FTP_HOST="waws-prod-dxb-003.ftp.azurewebsites.windows.net"
FTP_USER="kioskhealthappfelin\\\$kioskhealthappfelin"
FTP_PASS="NA2w0E388xy8sfiJWlN3Cxtpg76AXdHu5NGFf17tR8wr3FCP1E6Mqljkx9LD"

echo "📋 Step 1: Testing FTP connection..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
pwd
quit
"

if [ $? -eq 0 ]; then
    echo "✅ FTP connection successful!"
else
    echo "❌ FTP connection failed!"
    exit 1
fi

echo "📤 Step 2: Uploading essential configuration files..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes  
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
put server.js
put web.config
put package.json
put package-lock.json
put next.config.ts
put next-i18next.config.js
put tsconfig.json
quit
"

echo "📤 Step 3: Uploading .next build folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R .next .next
quit
"

echo "📤 Step 4: Uploading public folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R public public
quit
"

echo "📤 Step 5: Uploading shenai-sdk folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R shenai-sdk shenai-sdk
quit
"

echo "📤 Step 6: Uploading src folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R src src
quit
"

echo "📤 Step 7: Uploading components folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R components components
quit
"

echo "📤 Step 8: Uploading hooks folder..."
lftp -c "
set ssl:verify-certificate no
set ftp:ssl-allow yes
set ftp:ssl-force yes
open ftps://$FTP_HOST
user $FTP_USER $FTP_PASS
cd /site/wwwroot
mirror -R hooks hooks
quit
"

echo ""
echo "🎉 Deployment completed successfully!"
echo "====================================="
echo "🌐 Your app is available at: https://kioskhealthappfelin.uaenorth-01.azurewebsites.net"
echo ""
echo "📝 Post-deployment notes:"
echo "• Azure will automatically run 'npm install'"
echo "• The app starts using server.js"
echo "• Check Azure Portal > Log Stream for any issues"
echo "• Restart App Service if needed"
echo ""
echo "🔧 Usage: ./deploy-to-azure.sh" 