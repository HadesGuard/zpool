#!/bin/bash

# Download Zama SDK script
echo "🔄 Downloading Zama SDK..."

# Create sdk directory if it doesn't exist
mkdir -p public/sdk

# Try to download from CDN
echo "📥 Trying to download from CDN..."
curl -L -o public/sdk/relayer-sdk-js.umd.cjs https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs

if [ $? -eq 0 ]; then
    echo "✅ Successfully downloaded SDK from CDN"
    echo "📁 File saved to: public/sdk/relayer-sdk-js.umd.cjs"
    echo "📊 File size: $(ls -lh public/sdk/relayer-sdk-js.umd.cjs | awk '{print $5}')"
else
    echo "❌ Failed to download from CDN"
    echo "🔄 Trying alternative URL..."
    
    # Try alternative URL
    curl -L -o public/sdk/relayer-sdk-js.umd.cjs https://cdn.zama.ai/relayer-sdk-js/latest/relayer-sdk-js.umd.cjs
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully downloaded SDK from alternative CDN"
        echo "📁 File saved to: public/sdk/relayer-sdk-js.umd.cjs"
        echo "📊 File size: $(ls -lh public/sdk/relayer-sdk-js.umd.cjs | awk '{print $5}')"
    else
        echo "❌ Failed to download from all CDN sources"
        echo "📋 Manual download instructions:"
        echo "1. Visit: https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs"
        echo "2. Save the file as: public/sdk/relayer-sdk-js.umd.cjs"
        echo "3. Or try: https://cdn.zama.ai/relayer-sdk-js/latest/relayer-sdk-js.umd.cjs"
    fi
fi

echo ""
echo "🚀 Next steps:"
echo "1. Run: npm start"
echo "2. Check console for SDK loading status"
echo "3. Use debug buttons in the app to test SDK" 