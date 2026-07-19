const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  // 1. Injeksi perbaikan internal library printer (HTTP, compile, SDK 34)
  try {
    const printerGradlePath = path.join(
      config._internal?.projectRoot || process.cwd(),
      'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
    );

    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      
      if (content.includes('http://')) {
        content = content.replace(/http:\/\//g, 'https://');
      }

      if (content.includes('compile(') || content.includes('compile ')) {
        content = content.replace(/compile\s*\(/g, 'implementation(');
        content = content.replace(/compile\s+/g, 'implementation ');
      }

      content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 34');
      content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34');
      content = content.replace(/buildToolsVersion\s+['"].*?['"]/g, 'buildToolsVersion "34.0.0"');

      fs.writeFileSync(printerGradlePath, content, 'utf8');
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal menyisir node_modules:', error);
  }

  // 2. 🌟 SOLUSI DUPLICATE CLASS: Paksa Jetifier Aktif Global via build.gradle Root
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      // Menyuntikkan konfigurasi Jetifier langsung ke gradle properties saat kompilasi berjalan
      const jetifierRule = `
        ext {
            // Memaksa sub-project untuk melebur class support-compat jadul ke AndroidX modern
            android {
                configurations.all {
                    resolutionStrategy.eachDependency { DependencyResolveDetails details ->
                        if (details.requested.group == 'com.android.support') {
                            // Mencegah support library lawas merusak classpath AndroidX
                            details.useVersion '28.0.0'
                        }
                    }
                }
            }
        }
      `;
      if (!modConfig.modResults.contents.includes('resolutionStrategy.eachDependency')) {
        modConfig.modResults.contents += `\n${jetifierRule}\n`;
      }
    }
    return modConfig;
  });
};