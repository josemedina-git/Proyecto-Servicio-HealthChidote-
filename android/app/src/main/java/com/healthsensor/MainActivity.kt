package com.healthsensor

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.content.Intent
import android.nfc.NfcAdapter
import android.os.Bundle
import android.app.PendingIntent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import java.io.InputStream
import java.io.OutputStream
import java.net.Socket
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class MainActivity : ReactActivity() {
    private val TAG = "HealthSensor"
    private var nfcAdapter: NfcAdapter? = null
    
    private val healthConnectClient by lazy { HealthConnectClient.getOrCreate(this) }
    private val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class),
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),
        HealthPermission.getReadPermission(BloodGlucoseRecord::class)
    )

    private var wifiSocket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null

    override fun getMainComponentName(): String = "HealthSensor"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar NFC
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        
        requestHealthPermissions()
        connectWifi()
        lifecycleScope.launch {
            readHealthData()
        }
    }

    private fun requestHealthPermissions() {
        try {
            val requestPermissions = registerForActivityResult(
                PermissionController.createRequestPermissionResultContract()
            ) { grantedPermissions ->
                if (permissions == grantedPermissions) {
                    Log.d("HealthConnect", "Todos los permisos concedidos")
                    // Notificar a JavaScript que los permisos se han concedido
                    val reactContext = (application as ReactApplication)
                        .reactNativeHost
                        .reactInstanceManager
                        .currentReactContext
                    
                    if (reactContext != null) {
                        val eventEmitter = reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        val params = Arguments.createMap()
                        params.putBoolean("granted", true)
                        eventEmitter.emit("onHealthPermissionsChanged", params)
                    }
                } else {
                    Log.e("HealthConnect", "Permisos no concedidos")
                    // Notificar a JavaScript que los permisos NO se han concedido
                    val reactContext = (application as ReactApplication)
                        .reactNativeHost
                        .reactInstanceManager
                        .currentReactContext
                    
                    if (reactContext != null) {
                        val eventEmitter = reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        val params = Arguments.createMap()
                        params.putBoolean("granted", false)
                        eventEmitter.emit("onHealthPermissionsChanged", params)
                    }
                }
            }
            requestPermissions.launch(permissions)
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al solicitar permisos: ${e.message}")
        }
    }

    private fun connectWifi() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                wifiSocket = Socket("192.168.100.22", 80)
                inputStream = wifiSocket?.getInputStream()
                outputStream = wifiSocket?.getOutputStream()
                Log.d("WiFi", "Conectado al ESP32")
            } catch (e: Exception) {
                Log.e("WiFi", "Error al conectar al dispositivo", e)
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun readHealthData() {
        readHeartRate(healthConnectClient) {}
        readBloodOxygen(healthConnectClient) {}
        readBloodPressure(healthConnectClient) {}
        readBodyTemperature(healthConnectClient) {}
        readBloodGlucose(healthConnectClient) {}
    }

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun readHeartRate(client: HealthConnectClient, onResult: (String) -> Unit) {
        try {
            val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())
            val response = client.readRecords(ReadRecordsRequest(HeartRateRecord::class, timeRangeFilter))
            val latestRecord = response.records.maxByOrNull { record ->
                record.samples.maxOfOrNull { it.time.toEpochMilli() } ?: 0
            }
            latestRecord?.samples?.maxByOrNull { it.time.toEpochMilli() }?.let { sample ->
                val formattedTime = sample.time.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                onResult("${sample.beatsPerMinute} BPM (Fecha: $formattedTime)")
            } ?: onResult("No hay datos disponibles")
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al leer la frecuencia cardíaca", e)
            onResult("Error al obtener datos")
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun readBloodOxygen(client: HealthConnectClient, onResult: (String) -> Unit) {
        try {
            val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())
            val response = client.readRecords(ReadRecordsRequest(OxygenSaturationRecord::class, timeRangeFilter))
            val latestRecord = response.records.maxByOrNull { it.time }
            latestRecord?.let { record ->
                val formattedTime = record.time.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                onResult("${record.percentage}% (Fecha: $formattedTime)")
            } ?: onResult("No hay datos disponibles")
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al leer SpO2", e)
            onResult("Error al obtener datos")
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun readBloodPressure(client: HealthConnectClient, onResult: (String) -> Unit) {
        try {
            val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())
            val response = client.readRecords(ReadRecordsRequest(BloodPressureRecord::class, timeRangeFilter))
            val latestRecord = response.records.maxByOrNull { it.time }
            latestRecord?.let { record ->
                val formattedTime = record.time.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                onResult("${record.systolic}/${record.diastolic} (Fecha: $formattedTime)")
            } ?: onResult("No hay datos disponibles")
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al leer presión arterial", e)
            onResult("Error al obtener datos")
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun readBodyTemperature(client: HealthConnectClient, onResult: (String) -> Unit) {
        try {
            val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())
            val response = client.readRecords(ReadRecordsRequest(BodyTemperatureRecord::class, timeRangeFilter))
            val latestRecord = response.records.maxByOrNull { it.time }
            latestRecord?.let { record ->
                val formattedTime = record.time.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                onResult("${record.temperature.inCelsius}°C (Fecha: $formattedTime)")
            } ?: onResult("No hay datos disponibles")
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al leer temperatura corporal", e)
            onResult("Error al obtener datos")
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun readBloodGlucose(client: HealthConnectClient, onResult: (String) -> Unit) {
        try {
            val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())
            val response = client.readRecords(ReadRecordsRequest(BloodGlucoseRecord::class, timeRangeFilter))
            val latestRecord = response.records.maxByOrNull { it.time }
            latestRecord?.let { record ->
                val formattedTime = record.time.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                onResult("${record.level.inMilligramsPerDeciliter} mg/dL (Fecha: $formattedTime)")
            } ?: onResult("No hay datos disponibles")
        } catch (e: Exception) {
            Log.e("HealthConnect", "Error al leer nivel de glucosa", e)
            onResult("Error al obtener datos")
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Configurar la detección de NFC en primer plano
        if (nfcAdapter != null && nfcAdapter!!.isEnabled) {
            val intent = Intent(this, javaClass).apply {
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_MUTABLE
            )
            val techLists = arrayOf(
                arrayOf("android.nfc.tech.NfcV"),
                arrayOf("android.nfc.tech.IsoDep")
            )
            nfcAdapter?.enableForegroundDispatch(
                this,
                pendingIntent,
                arrayOf(IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED)),
                techLists
            )
        }
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        
        // Cuando se detecta un tag NFC, pasar el intent al módulo nativo
        if (NfcAdapter.ACTION_TECH_DISCOVERED == intent.action) {
            // Obtener el módulo Health Data
            val healthDataModule = (application as ReactApplication)
                .reactNativeHost
                .reactInstanceManager
                .currentReactContext
                ?.getNativeModule(HealthDataModule::class.java)
            
            // Pasar el intent al módulo para procesarlo
            healthDataModule?.processNfcIntent(intent)
        }
    }
}