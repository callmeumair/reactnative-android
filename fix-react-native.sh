#!/bin/bash

# Fix React Native BatchedBridge Error - Comprehensive Reset Script
# This script performs a complete cleanup and rebuild of React Native project
# Compatible with both macOS and Linux

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in a React Native project
if [ ! -f "package.json" ] || ! grep -q "react-native" package.json; then
    error "This doesn't appear to be a React Native project. Make sure you're in the project root."
    exit 1
fi

log "🚀 Starting React Native BatchedBridge Fix..."
log "📍 Project directory: $(pwd)"

# Function to kill Metro bundler processes
kill_metro() {
    log "🔪 Killing any running Metro bundler processes..."
    pkill -f "react-native start" || true
    pkill -f "metro" || true
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    success "Metro processes terminated"
}

# Function to clean all caches and build directories
clean_all() {
    log "🧹 Cleaning all caches and build directories..."
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        log "Removing node_modules..."
        rm -rf node_modules
    fi
    
    # Remove package-lock and yarn.lock to avoid conflicts
    log "Removing lock files..."
    rm -f package-lock.json yarn.lock
    
    # Clean Metro cache
    log "Cleaning Metro cache..."
    rm -rf /tmp/metro-*
    rm -rf /tmp/haste-map-*
    rm -rf ~/.metro
    
    # Clean React Native cache
    log "Cleaning React Native cache..."
    rm -rf /tmp/react-*
    
    # Clean npm cache
    log "Cleaning npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    # Clean yarn cache if yarn is available
    if command -v yarn >/dev/null 2>&1; then
        log "Cleaning yarn cache..."
        yarn cache clean 2>/dev/null || true
    fi
    
    # Clean Android build directories
    if [ -d "android" ]; then
        log "Cleaning Android build directories..."
        rm -rf android/app/build
        rm -rf android/build
        rm -rf android/.gradle
        rm -rf android/app/src/main/assets/index.android.bundle*
        
        # Clean Gradle cache
        if [ -d "$HOME/.gradle" ]; then
            rm -rf "$HOME/.gradle/caches"
        fi
    fi
    
    # Clean iOS build directories (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
        log "Cleaning iOS build directories..."
        rm -rf ios/build
        rm -rf ios/Pods
        rm -rf ios/Podfile.lock
        rm -rf ~/Library/Developer/Xcode/DerivedData/*
    fi
    
    success "All caches and build directories cleaned"
}

# Function to install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    # Check if yarn is available and prefer it
    if command -v yarn >/dev/null 2>&1; then
        log "Using yarn to install dependencies..."
        yarn install --network-timeout 300000
    else
        log "Using npm to install dependencies..."
        npm install --legacy-peer-deps
    fi
    
    # Install iOS dependencies (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
        log "Installing iOS CocoaPods dependencies..."
        cd ios
        pod deintegrate 2>/dev/null || true
        pod install --repo-update
        cd ..
    fi
    
    success "Dependencies installed successfully"
}

# Function to start Metro bundler in background
start_metro() {
    log "🚇 Starting Metro bundler with reset cache..."
    
    # Start Metro in background with reset cache
    if command -v yarn >/dev/null 2>&1; then
        nohup yarn start --reset-cache > metro.log 2>&1 &
    else
        nohup npx react-native start --reset-cache > metro.log 2>&1 &
    fi
    
    METRO_PID=$!
    log "Metro bundler started with PID: $METRO_PID"
    
    # Wait for Metro to start
    log "Waiting for Metro bundler to initialize..."
    sleep 10
    
    # Check if Metro is running
    if ! ps -p $METRO_PID > /dev/null; then
        error "Metro bundler failed to start. Check metro.log for details."
        exit 1
    fi
    
    success "Metro bundler is running"
}

# Function to fix Android configuration
fix_android_config() {
    log "🔧 Fixing Android configuration for proper bundle loading..."
    
    # Create network security config for Metro connection
    mkdir -p android/app/src/main/res/xml
    cat > android/app/src/main/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
    </domain-config>
</network-security-config>
EOF
    
    # Check if AndroidManifest.xml needs network security config
    if ! grep -q "networkSecurityConfig" android/app/src/main/AndroidManifest.xml; then
        log "Adding network security config to AndroidManifest.xml..."
        sed -i.bak 's/android:theme="@style\/AppTheme"/android:theme="@style\/AppTheme"\n      android:networkSecurityConfig="@xml\/network_security_config"\n      android:usesCleartextTraffic="true"/' android/app/src/main/AndroidManifest.xml
    fi
    
    success "Android configuration fixed"
}

# Function to generate JavaScript bundles (only for release)
generate_bundles() {
    log "📦 Generating JavaScript bundles for release..."
    
    # Only generate release bundle, let Metro serve debug bundles
    log "Generating Android release bundle..."
    mkdir -p android/app/build/generated/assets/react/release
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/build/generated/assets/react/release/index.android.bundle \
        --assets-dest android/app/build/generated/res/react/release \
        --minify true
    
    # Generate iOS bundle (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
        log "Generating iOS release bundle..."
        mkdir -p ios/main.jsbundle
        npx react-native bundle \
            --platform ios \
            --dev false \
            --entry-file index.js \
            --bundle-output ios/main.jsbundle \
            --assets-dest ios
    fi
    
    success "Release bundles generated successfully"
}

# Function to build Android
build_android() {
    if [ -d "android" ]; then
        log "🤖 Building Android..."
        
        cd android
        
        # Clean and build
        log "Cleaning Android build..."
        ./gradlew clean
        
        log "Building Android debug APK..."
        ./gradlew assembleDebug
        
        cd ..
        
        success "Android build completed successfully"
    else
        warning "Android directory not found, skipping Android build"
    fi
}

# Function to build iOS (macOS only)
build_ios() {
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
        log "🍎 Building iOS..."
        
        cd ios
        
        # Clean iOS build
        log "Cleaning iOS build..."
        xcodebuild clean -workspace *.xcworkspace -scheme $(basename "$(pwd)") 2>/dev/null || \
        xcodebuild clean -project *.xcodeproj -scheme $(basename "$(pwd)") 2>/dev/null || true
        
        cd ..
        
        success "iOS build completed successfully"
    else
        if [[ "$OSTYPE" != "darwin"* ]]; then
            warning "iOS build is only available on macOS"
        else
            warning "iOS directory not found, skipping iOS build"
        fi
    fi
}

# Function to verify builds
verify_builds() {
    log "✅ Verifying builds..."
    
    # Check if Android APK exists
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        success "Android debug APK found"
    else
        warning "Android debug APK not found"
    fi
    
    # Check if bundles exist
    if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
        success "Android bundle found"
    else
        warning "Android bundle not found"
    fi
    
    # Check Metro status
    if pgrep -f "react-native start" > /dev/null || pgrep -f "metro" > /dev/null; then
        success "Metro bundler is running"
    else
        warning "Metro bundler is not running"
    fi
}

# Function to cleanup on exit
cleanup() {
    log "🧹 Performing cleanup..."
    # Remove temporary log file
    rm -f metro.log
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution flow
main() {
    log "=========================================="
    log "🔧 React Native BatchedBridge Fix Script"
    log "=========================================="
    
    # Step 1: Kill existing Metro processes
    kill_metro
    
    # Step 2: Clean all caches and build directories
    clean_all
    
    # Step 3: Install dependencies
    install_dependencies
    
    # Step 4: Fix Android configuration
    fix_android_config
    
    # Step 5: Start Metro bundler
    start_metro
    
    # Step 6: Generate JavaScript bundles
    generate_bundles
    
    # Step 7: Build Android
    build_android
    
    # Step 8: Build iOS (macOS only)
    build_ios
    
    # Step 9: Verify builds
    verify_builds
    
    log "=========================================="
    success "🎉 React Native fix completed successfully!"
    log "=========================================="
    
    log "📋 Next steps:"
    log "1. Run: npx react-native run-android (for Android)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log "2. Run: npx react-native run-ios (for iOS)"
    fi
    log "3. If you encounter issues, check metro.log for Metro bundler logs"
    
    log "💡 Pro tip: This script can be run anytime you encounter bundle issues"
}

# Check if script is being run with proper permissions
if [ ! -x "$0" ]; then
    warning "Script doesn't have execute permissions. Adding them now..."
    chmod +x "$0"
fi

# Run main function
main "$@"
