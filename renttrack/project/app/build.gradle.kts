plugins { id("com.android.application") version "8.7.3" }
android {
  namespace = "studio.futurecode.renttrack"
  compileSdk = 35
  defaultConfig {
    applicationId = "studio.futurecode.renttrack"
    minSdk = 28
    targetSdk = 35
    versionCode = 1
    versionName = "1.0.0"
  }
  buildTypes { release { isMinifyEnabled = false } }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}
dependencies { implementation("androidx.webkit:webkit:1.17.0") }
