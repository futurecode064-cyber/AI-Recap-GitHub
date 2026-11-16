plugins { id("com.android.application") }
android {
    namespace = "mm.futurecode.aitools"
    compileSdk = 35
    buildFeatures { buildConfig = true }
    defaultConfig { applicationId = "mm.futurecode.aitools"; minSdk = 26; targetSdk = 35; versionCode = 3; versionName = "1.0.2" }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
dependencies {
    implementation("androidx.work:work-runtime:2.9.1")
    implementation("androidx.core:core:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}