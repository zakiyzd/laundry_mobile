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
      
      // 1. Ubah SEMUA link HTTP internal menjadi HTTPS (Solusi eror sebelumnya)
      if (content.includes('http://')) {
        content = content.replace(/http:\/\//g, 'https://');
      }

      // 2. 🌟 SOLUSI BARU: Ubah perintah jadul 'compile' menjadi 'implementation' agar kompatibel dengan Gradle modern
      if (content.includes('compile(') || content.includes('compile ')) {
        // Mengganti compile fileTree, compile project, atau compile biasa
        content = content.replace(/compile\s*\(/g, 'implementation(');
        content = content.replace(/compile\s+/g, 'implementation ');
        console.log('[InsecureRepoPlugin] Sukses memperbarui method compile() menjadi implementation()!');
      }
      
      fs.writeFileSync(printerGradlePath, content, 'utf8');
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal menyisir node_modules:', error);
  }

  // Tetap pasang jaring pengaman global di root proyek
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