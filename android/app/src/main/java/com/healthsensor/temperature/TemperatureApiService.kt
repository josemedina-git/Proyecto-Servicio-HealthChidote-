package com.healthsensor.temperature

import retrofit2.Call
import retrofit2.http.GET

interface TemperatureApiService {
    @GET("temperature")
    fun getTemperature(): Call<TemperatureData>
}