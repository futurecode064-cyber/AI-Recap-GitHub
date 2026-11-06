plugins { id("com.android.application") version "8.7.3"; }
fun env(name:String):String=providers.environmentVariable(name).orNull.orEmpty()
fun quoted(s:String):String="\""+s.replace("\\","\\\\").replace("\"","\\\"")+"\""
android {
 namespace = "studio.futurecode.renttrack"
 compileSdk = 35
 defaultConfig {
  applicationId = "studio.futurecode.renttrack"
  minSdk = 28
  targetSdk = 35
  versionCode = 3
  versionName = "1.1.1"
  buildConfigField("String","FIREBASE_API_KEY",quoted(env("FC_FIREBASE_API_KEY")))
  buildConfigField("String","FIREBASE_APP_ID",quoted(env("FC_FIREBASE_APP_ID")))
  buildConfigField("String","FIREBASE_PROJECT_ID",quoted(env("FC_FIREBASE_PROJECT_ID")))
  buildConfigField("String","FIREBASE_SENDER_ID",quoted(env("FC_FIREBASE_SENDER_ID")))
 }
 buildFeatures { buildConfig = true }
 buildTypes { release { isMinifyEnabled = false } }
 compileOptions {
  sourceCompatibility = JavaVersion.VERSION_17
  targetCompatibility = JavaVersion.VERSION_17
 }
}
dependencies {
 implementation("androidx.webkit:webkit:1.17.1")
 implementation("androidx.core:core:1.15.0")
 implementation("androidx.work:work-runtime:2.10.2")
 implementation(platform("com.google.firebase:firebase-bom:35.1.0"))
 implementation("com.google.firebase:firebase-messaging")
}
