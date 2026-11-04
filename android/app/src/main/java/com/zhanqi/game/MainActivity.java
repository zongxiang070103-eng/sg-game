package com.zhanqi.game;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15 起状态栏/导航栏强制透明，主题里的 system bar 颜色不再生效。
        // 这里让窗口底色与页面一致，并强制使用浅色图标，避免顶部/底部出现白条。
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#0B0704")));
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setAppearanceLightStatusBars(false);
        bars.setAppearanceLightNavigationBars(false);
    }
}
