package com.healthsensor

import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import java.math.BigDecimal
import java.time.Instant

class HealthDataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val healthConnectClient = HealthConnectClient.getOrCreate(reactContext)

    override fun getName(): String {
        return "HealthDataModule"
    }

    @ReactMethod
    fun getHealthData(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val timeRangeFilter = TimeRangeFilter.between(Instant.now().minusSeconds(86400), Instant.now())

                // Obtener datos de Frecuencia Cardíaca
                val heartRateResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(HeartRateRecord::class, timeRangeFilter)
                )
                val heartRate = heartRateResponse.records
                    .maxByOrNull { it.samples.maxOfOrNull { sample -> sample.time.toEpochMilli() } ?: 0 }
                    ?.samples?.maxByOrNull { it.time.toEpochMilli() }
                    ?.beatsPerMinute?.toInt() ?: 0 // Conversión explícita a Int

                // Obtener datos de Oxígeno en Sangre
                val oxygenResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(OxygenSaturationRecord::class, timeRangeFilter)
                )
                val oxygen = oxygenResponse.records
                    .maxByOrNull { it.time }
                    ?.percentage?.let { it as? BigDecimal }?.toDouble() ?: 0.0

                // Obtener datos de Presión Arterial
                val pressureResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(BloodPressureRecord::class, timeRangeFilter)
                )
                val pressure = pressureResponse.records.maxByOrNull { it.time }?.let {
                    "${it.systolic}/${it.diastolic}"
                } ?: "No disponible"

                // Enviar datos a React Native
                val data = Arguments.createMap()
                data.putInt("heartRate", heartRate) // Ahora es Int
                data.putDouble("oxygen", oxygen) // Ahora es Double
                data.putString("pressure", pressure)

                // Log para depuración
                Log.d("HealthDataModule", "Datos de salud: heartRate=$heartRate, oxygen=$oxygen, pressure=$pressure")

                promise.resolve(data)

            } catch (e: Exception) {
                Log.e("HealthConnect", "Error al leer datos", e)
                promise.reject("ERROR", "No se pudieron obtener los datos")
            }
        }
    }
}
