const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  try {
    const printerGradlePath = path.join(
      config._internal?.projectRoot || process.cwd(),
      'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
    );

    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      
      // 1. Ubah SEMUA link HTTP internal menjadi HTTPS
      if (content.includes('http://')) {
        content = content.replace(/http:\/\//g, 'https://');
      }

      // 2. Ubah perintah jadul 'compile' menjadi 'implementation'
      if (content.includes('compile(') || content.includes('compile ')) {
        content = content.replace(/compile\s*\(/g, 'implementation(');
        content = content.replace(/compile\s+/g, 'implementation ');
      }

      // 3. 🌟 SOLUSI BARU: Dongkrak SDK Version secara paksa ke Android 34 agar lolos Java 9+ compilation
      content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 34');
      content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34');
      
      // Jika ada buildToolsVersion jadul, kita hapus atau sesuaikan biar ikut ke root project
      content = content.replace(/buildToolsVersion\s+['"].*?['"]/g, 'buildToolsVersion "34.0.0"');

      fs.writeFileSync(printerGradlePath, content, 'utf8');
      console.log('[InsecureRepoPlugin] Sukses menaikkan SDK Version library printer ke level 34!');
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal menyisir node_modules:', error);
  }

  // Jaring pengaman global di root proyek
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const fallbackRule = `
        allprojects {
            repositories {
                all { repo ->
                    if (repo.hasProperty('url') && repo.url.toString().startsWith("http://")) {
                        repo.allowInsecureProtocol = true
                    }
                }
            }
        }
      `;
      if (!modConfig.modResults.contents.includes('allowInsecureProtocol')) {
        modConfig.modResults.contents += `\n${fallbackRule}\n`;
      }
    }
    return modConfig;
  });
};