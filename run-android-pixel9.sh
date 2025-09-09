#!/bin/bash

# React Native Android Pixel 9 Runner Script
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set up Android environment
export ANDROID_HOME=~/Library/Android/sdk
export ANDROID_SDK_ROOT=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

log "🔧 Setting up Android environment..."
log "ANDROID_HOME: $ANDROID_HOME"

# Check if emulator is already running
if adb devices | grep -q "emulator"; then
    log "✅ Android emulator is already running"
else
    log "🚀 Starting Pixel 9 emulator..."
    emulator @Pixel_9 -no-snapshot &
    EMULATOR_PID=$!
    
    log "⏳ Waiting for emulator to boot (this may take 1-2 minutes)..."
    
    # Wait for emulator to be ready
    timeout=120  # 2 minutes timeout
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if adb devices | grep -q "emulator.*device"; then
            success "🎉 Emulator is ready!"
            break
        fi
        
        if [ $((counter % 10)) -eq 0 ]; then
            log "Still waiting for emulator... ($counter/${timeout}s)"
        fi
        
        sleep 1
        counter=$((counter + 1))
    done
    
    if [ $counter -eq $timeout ]; then
        error "❌ Emulator failed to start within timeout"
        exit 1
    fi
fi

# Additional wait for full system boot
log "⏳ Waiting for system to fully boot..."
adb wait-for-device
sleep 10

# Show connected devices
log "📱 Connected devices:"
adb devices

# Start Metro bundler in background if not running
if ! pgrep -f "react-native start" > /dev/null; then
    log "🚇 Starting Metro bundler..."
    npx react-native start --reset-cache &
    sleep 5
fi

# Build and install the app
log "🔨 Building and installing React Native app..."
npx react-native run-android

success "🎉 App should now be running on Pixel 9 emulator!"
