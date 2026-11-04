import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhanqi.game',
  appName: '战棋',
  webDir: 'dist',
  plugins: {
    // 页面本身是深色底，系统栏图标也固定用浅色，避免白底深图标。
    SystemBars: {
      style: 'DARK'
    }
  }
};

export default config;
