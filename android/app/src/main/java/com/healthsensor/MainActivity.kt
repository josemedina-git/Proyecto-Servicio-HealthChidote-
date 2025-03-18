package com.healthsensor

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import java.io.InputStream
import java.io.OutputStream
import java.net.Socket
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class MainActivity : ReactActivity() {
    private val healthConnectClient by lazy { HealthConnectClient.getOrCreate(this) }
    private val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class)
    )

    private var wifiSocket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null

    override fun getMainComponentName(): String = "HealthSensor"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestHealthPermissions()
        connectWifi()
        lifecycleScope.launch {
            readHealthData()
        }
    }

    private fun requestHealthPermissions() {
        val requestPermissions = registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { grantedPermissions ->
            if (permissions == grantedPermissions) {
                Log.d("HealthConnect", "Todos los permisos concedidos")
            } else {
                Log.e("HealthConnect", "Permisos no concedidos")
            }
        }
        requestPermissions.launch(permissions)
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

    private suspend fun readHealthData() {
        readHeartRate(healthConnectClient) {}
        readBloodOxygen(healthConnectClient) {}
        readBloodPressure(healthConnectClient) {}
    }
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
