# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Añadir estas reglas al final del archivo android/app/proguard-rules.pro

# ===== RETROFIT =====
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# ===== GSON =====
-dontwarn com.google.gson.**
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ===== CLASES DE TEMPERATURA =====
-keep class com.healthsensor.temperature.** { *; }
-keepclassmembers class com.healthsensor.temperature.** { *; }

# Mantener las clases de datos específicamente
-keep class com.healthsensor.temperature.TemperatureData { *; }
-keep class com.healthsensor.temperature.TemperatureApiService { *; }
-keep class com.healthsensor.temperature.RetrofitClient { *; }

# ===== OKHTTP (usado por Retrofit) =====
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ===== HEALTH CONNECT =====
-keep class androidx.health.connect.** { *; }
-dontwarn androidx.health.connect.**

# ===== REACT NATIVE BRIDGE =====
-keep class com.healthsensor.HealthDataModule { *; }
-keepclassmembers class com.healthsensor.HealthDataModule { *; }

# ===== NETWORKING GENERAL =====
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class * extends java.lang.Exception

# Para evitar warnings de clases no encontradas
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*