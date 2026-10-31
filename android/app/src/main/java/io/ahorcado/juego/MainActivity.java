package io.ahorcado.juego;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;

import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    private AppUpdateManager appUpdateManager;
    private boolean checkingForUpdate;
    private boolean updateFlowStarted;
    private boolean updateDialogVisible;

    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {
            updateFlowStarted = false;
            if (result.getResultCode() != RESULT_OK) {
                // La versión antigua no se puede seguir utilizando tras rechazar la actualización.
                finishAffinity();
            } else {
                checkForUpdates();
            }
        });

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        appUpdateManager = AppUpdateManagerFactory.create(this);
        getBridge().getWebView().setVisibility(View.INVISIBLE);
        checkForUpdates();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (appUpdateManager != null) {
            checkForUpdates();
        }
    }

    private void checkForUpdates() {
        if (checkingForUpdate) {
            return;
        }
        checkingForUpdate = true;
        appUpdateManager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                checkingForUpdate = false;
                int availability = info.updateAvailability();
                if (availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                    startImmediateUpdate(info);
                } else if (availability == UpdateAvailability.UPDATE_AVAILABLE) {
                    if (info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                        if (!updateFlowStarted) {
                            startImmediateUpdate(info);
                        }
                    } else {
                        Log.w(TAG, "La actualización inmediata no está permitida por Google Play");
                        showUpdateRequiredDialog();
                    }
                } else if (!updateFlowStarted) {
                    getBridge().getWebView().setVisibility(View.VISIBLE);
                }
            })
            .addOnFailureListener(error -> {
                checkingForUpdate = false;
                Log.w(TAG, "No se pudo comprobar la actualización de Google Play", error);
                // Google Play puede no estar disponible (por ejemplo, en desarrollo o sin conexión).
                if (!updateFlowStarted) {
                    getBridge().getWebView().setVisibility(View.VISIBLE);
                }
            });
    }

    private void startImmediateUpdate(AppUpdateInfo info) {
        getBridge().getWebView().setVisibility(View.INVISIBLE);
        updateFlowStarted = appUpdateManager.startUpdateFlowForResult(
            info,
            updateLauncher,
            AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
        );
        if (!updateFlowStarted) {
            Log.w(TAG, "Google Play no pudo iniciar la actualización inmediata");
            showUpdateRequiredDialog();
        }
    }

    private void showUpdateRequiredDialog() {
        if (updateDialogVisible || isFinishing()) {
            return;
        }
        updateDialogVisible = true;
        new AlertDialog.Builder(this)
            .setTitle(R.string.update_required_title)
            .setMessage(R.string.update_required_message)
            .setPositiveButton(R.string.open_google_play, (dialog, which) -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(
                    "https://play.google.com/store/apps/details?id=" + getPackageName()
                ));
                startActivity(intent);
                finishAffinity();
            })
            .setNegativeButton(R.string.close_app, (dialog, which) -> finishAffinity())
            .setCancelable(false)
            .show();
    }
}
