package com.healthsensor.temperature

import com.google.gson.annotations.SerializedName

data class TemperatureData(
    @SerializedName("temperature")
    val temperature: Double = 0.0,
    
    @SerializedName("timestamp")
    val timestamp: Long = System.currentTimeMillis()
) {
    // Constructor sin argumentos para Gson
    constructor() : this(0.0, System.currentTimeMillis())
}