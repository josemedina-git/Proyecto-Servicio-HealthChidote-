package com.healthsensor.temperature

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import com.google.gson.GsonBuilder

object RetrofitClient {
    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String? = null

    fun getClient(baseUrl: String): Retrofit {
        // Crear nuevo cliente si la URL cambió o no existe
        if (retrofit == null || currentBaseUrl != baseUrl) {
            
            // Configurar OkHttpClient con timeouts
            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build()

            // Configurar Gson para ser más permisivo
            val gson = GsonBuilder()
                .setLenient()
                .create()

            retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                
            currentBaseUrl = baseUrl
        }
        return retrofit!!
    }
}