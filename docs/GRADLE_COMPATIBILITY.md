# Gradle Compatibility Guide for React Native

This guide helps you maintain compatibility between React Native, Gradle, and Android Gradle Plugin versions to prevent build errors.

## Quick Fix

If you're experiencing Gradle build errors, run:

```bash
./scripts/fix-gradle-compatibility.sh
```

## Version Compatibility Matrix

| React Native | Gradle | Android Gradle Plugin | Notes |
|--------------|--------|----------------------|-------|
| 0.72.x       | 8.3    | 8.1.4               | Stable |
| 0.73.x       | 8.4    | 8.2.0               | Stable |
| 0.74.x       | 8.5    | 8.3.0               | Latest |

## Common Error: `serviceOf` Unresolved Reference

This error occurs when there's a version mismatch between:
- React Native Gradle Plugin
- Gradle version
- Android Gradle Plugin

### Root Cause
The `serviceOf` function was introduced in newer Gradle versions, but older React Native Gradle plugins don't support it.

### Solution
1. **Update Gradle version** in `android/gradle/wrapper/gradle-wrapper.properties`
2. **Update Android Gradle Plugin** in `android/build.gradle`
3. **Clean and rebuild**

## Manual Fix Steps

### 1. Update Gradle Version
Edit `android/gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-bin.zip
```

### 2. Update Android Gradle Plugin
Edit `android/build.gradle`:
```gradle
classpath("com.android.tools.build:gradle:8.1.4")
```

### 3. Clean and Rebuild
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Prevention Strategies

### 1. Use the Compatibility Script
Always run `./scripts/fix-gradle-compatibility.sh` after:
- Updating React Native
- Cloning the project
- Switching branches

### 2. Version Locking
Consider locking specific versions in your `package.json`:
```json
{
  "devDependencies": {
    "@react-native/gradle-plugin": "0.72.11"
  }
}
```

### 3. CI/CD Integration
Add the compatibility script to your CI/CD pipeline:
```yaml
- name: Fix Gradle Compatibility
  run: ./scripts/fix-gradle-compatibility.sh
```

## Troubleshooting

### If the script doesn't work:

1. **Delete Gradle cache:**
   ```bash
   rm -rf android/.gradle
   rm -rf ~/.gradle/caches
   ```

2. **Clean node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Reset Android build:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew --stop
   cd ..
   ```

### Common Issues

1. **Permission denied on gradlew:**
   ```bash
   chmod +x android/gradlew
   ```

2. **Java version issues:**
   - Ensure you're using Java 11 or 17
   - Set `JAVA_HOME` environment variable

3. **Memory issues:**
   - Increase Gradle memory in `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
   ```

## Best Practices

1. **Always use the compatibility script** when setting up new environments
2. **Keep React Native and related packages in sync**
3. **Test builds regularly** to catch compatibility issues early
4. **Document version changes** in your project
5. **Use consistent development environments** across team members

## Resources

- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [Gradle Compatibility Matrix](https://developer.android.com/studio/releases/gradle-plugin)
- [React Native Release Notes](https://github.com/facebook/react-native/releases)
