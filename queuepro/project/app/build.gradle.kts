plugins { id("com.android.application") version "8.7.3" }
android {
  namespace = "com.futurecode.queuepro"
  compileSdk = 35
  defaultConfig {
    applicationId = "com.futurecode.queuepro"
    minSdk = 28
    targetSdk = 35
    versionCode = 1
    versionName = "1.0.0"
  }
  buildTypes { release { isMinifyEnabled = false } }
  compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
