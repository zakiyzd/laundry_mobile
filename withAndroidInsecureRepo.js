const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  // 1. Modifikasi File build.gradle Internal Library Printer (HTTP, compile, SDK 34)
  try {
    const printerGradlePath = path.join(
      config._internal?.projectRoot || process.cwd(),
      'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
    );

    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      
      // Bersihkan HTTP
      if (content.includes('http://')) {
        content = content.replace(/http:\/\//g, 'https://');
      }

      // Perbaiki compile -> implementation
      if (content.includes('compile(') || content.includes('compile ')) {
        content = content.replace(/compile\s*\(/g, 'implementation(');
        content = content.replace(/compile\s+/g, 'implementation ');
      }

      // Dongkrak SDK ke 34
      content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 34');
      content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34');
      content = content.replace(/buildToolsVersion\s+['"].*?['"]/g, 'buildToolsVersion "34.0.0"');

      fs.writeFileSync(printerGradlePath, content, 'utf8');
      console.log('[InsecureRepoPlugin] Berhasil meremajakan syntax internal library printer!');
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal memodifikasi node_modules:', error);
  }

  // 2. SOLUSI DUPLICATE CLASS YANG BENAR: Buang support library lawas dari allprojects
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const exclusionRule = `
        allprojects {
            configurations.all {
                // Menghapus dependencies support lawas agar tidak bentrok dengan AndroidX modern
                exclude group: 'com.android.support', module: 'support-compat'
                exclude group: 'com.android.support', module: 'support-media-compat'
            }
        }
      `;
      
      // Pastikan membersihkan injeksi yang eror kemarin dan pasang rule baru
      if (!modConfig.modResults.contents.includes('exclude group: \'com.android.support\'')) {
        modConfig.modResults.contents += `\n${exclusionRule}\n`;
      }
    }
    return modConfig;
  });
};