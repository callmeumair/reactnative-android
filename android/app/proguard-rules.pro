# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native

# Keep our application class
-keep public class com.commutetimely.MainApplication

# Disabling obfuscation is useful if you collect stack traces from production crashes
# (unless you are using a system that supports de-obfuscate the stack traces).
-dontobfuscate

# React Native

# Keep entire react-native libraries
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# okhttp
-dontwarn okio.**
-dontwarn com.squareup.okhttp.**
-dontwarn okhttp3.**

# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# React Native Push Notification
-keep class com.dieam.reactnativepushnotification.** { *; }

# React Native Permissions
-keep class com.zoontek.rnpermissions.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# Lottie React Native
-keep class com.airbnb.lottie.** { *; }

# Add any project specific keep options here:
