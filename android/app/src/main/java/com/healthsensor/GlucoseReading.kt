package com.healthsensor

import java.util.Date

data class GlucoseReading(
    val value: Int,            // Valor de glucosa en mg/dl
    val timestamp: Date = Date(), // Fecha y hora de la lectura
    val sensorId: String = ""   // ID único del sensor
)