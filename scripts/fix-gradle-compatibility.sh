#!/bin/bash

# Gradle Compatibility Fix Script for React Native
# This script helps maintain compatibility between React Native, Gradle, and Android Gradle Plugin

echo "🔧 React Native Gradle Compatibility Fix Script"
echo "================================================"

# Get React Native version
RN_VERSION=$(node -p "require('./package.json').dependencies['react-native']" | sed 's/[^0-9.]//g')
echo "📱 React Native version: $RN_VERSION"

# Determine compatible versions based on React Native version
case $RN_VERSION in
    0.72*)
        GRADLE_VERSION="8.0.2"
        AGP_VERSION="8.0.2"
        KOTLIN_VERSION="1.8.0"
        ;;
    0.73*)
        GRADLE_VERSION="8.4"
        AGP_VERSION="8.2.0"
        KOTLIN_VERSION="1.8.0"
        ;;
    0.74*)
        GRADLE_VERSION="8.5"
        AGP_VERSION="8.3.0"
        KOTLIN_VERSION="1.8.0"
        ;;
    *)
        echo "⚠️  Unknown React Native version. Using stable versions for 0.72.x"
        GRADLE_VERSION="8.0.2"
        AGP_VERSION="8.0.2"
        KOTLIN_VERSION="1.8.0"
        ;;
esac

echo "🎯 Target Gradle version: $GRADLE_VERSION"
echo "🎯 Target Android Gradle Plugin version: $AGP_VERSION"
echo "🎯 Target Kotlin version: $KOTLIN_VERSION"

# Update gradle-wrapper.properties
echo "📝 Updating gradle-wrapper.properties..."
sed -i '' "s|distributionUrl=.*gradle-.*-bin.zip|distributionUrl=https\\://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip|" android/gradle/wrapper/gradle-wrapper.properties

# Update build.gradle
echo "📝 Updating build.gradle..."
sed -i '' "s|classpath(\"com.android.tools.build:gradle:.*\")|classpath(\"com.android.tools.build:gradle:$AGP_VERSION\")|" android/build.gradle

# Update Kotlin version in build.gradle
echo "📝 Updating Kotlin version..."
sed -i '' "s|kotlinVersion = \".*\"|kotlinVersion = \"$KOTLIN_VERSION\"|" android/build.gradle
sed -i '' "s|classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:.*\")|classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION\")|" android/build.gradle

# Update Kotlin stdlib versions in resolutionStrategy
echo "📝 Updating Kotlin stdlib versions..."
sed -i '' "s|org.jetbrains.kotlin:kotlin-stdlib:.*|org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION|g" android/build.gradle
sed -i '' "s|org.jetbrains.kotlin:kotlin-stdlib-jdk7:.*|org.jetbrains.kotlin:kotlin-stdlib-jdk7:$KOTLIN_VERSION|g" android/build.gradle
sed -i '' "s|org.jetbrains.kotlin:kotlin-stdlib-jdk8:.*|org.jetbrains.kotlin:kotlin-stdlib-jdk8:$KOTLIN_VERSION|g" android/build.gradle
sed -i '' "s|org.jetbrains.kotlin:kotlin-stdlib-common:.*|org.jetbrains.kotlin:kotlin-stdlib-common:$KOTLIN_VERSION|g" android/build.gradle
sed -i '' "s|org.jetbrains.kotlin:kotlin-reflect:.*|org.jetbrains.kotlin:kotlin-reflect:$KOTLIN_VERSION|g" android/build.gradle

# Clean Gradle cache
echo "🧹 Cleaning Gradle cache..."
cd android
rm -rf .gradle
rm -rf build
./gradlew clean

if [ $? -eq 0 ]; then
    echo "✅ Gradle clean successful!"
else
    echo "❌ Gradle clean failed. Trying additional cleanup..."
    rm -rf ~/.gradle/caches
    ./gradlew clean
fi

cd ..

echo "✅ Gradle compatibility fix completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npx react-native run-android"
echo ""
echo "💡 If you encounter issues, try:"
echo "   - Delete node_modules and run npm install"
echo "   - Delete android/.gradle folder"
echo "   - Run this script again"
echo ""
echo "🔍 Common issues and solutions:"
echo "   - Kotlin version mismatch: This script should fix it"
echo "   - serviceOf unresolved reference: Fixed by compatible Gradle version"
echo "   - Build cache issues: Cleaned by this script"
