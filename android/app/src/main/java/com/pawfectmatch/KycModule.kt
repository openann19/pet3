package com.pawfectmatch

import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Minimal KYC Native Module
 * Only create if RN wrapper (e.g., @onfido/react-native-sdk) is unavailable
 */
class KycModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String = "KycModule"
    
    /**
     * Start KYC verification session
     * @param config Configuration map with userId, token, locale
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    fun startKycSession(config: ReadableMap, promise: Promise) {
        try {
            val userId = config.getString("userId") 
                ?: throw IllegalArgumentException("userId is required")
            val token = config.getString("token")
                ?: throw IllegalArgumentException("token is required")
            val locale = config.getString("locale") ?: "en"
            
            // TODO: Bridge to chosen KYC SDK (Onfido/Persona/Sumsub)
            // Example structure:
            // 1. Initialize SDK with token
            // 2. Start verification flow
            // 3. Return session ID
            
            val result = Arguments.createMap().apply {
                putString("sessionId", "kyc_session_${System.currentTimeMillis()}")
                putString("status", "started")
                putString("userId", userId)
            }
            
            promise.resolve(result)
            
            // Emit progress events
            sendEvent("KycProgress", Arguments.createMap().apply {
                putInt("progress", 0)
                putString("stage", "initialized")
            })
            
        } catch (e: Exception) {
            promise.reject("KYC_ERROR", e.message ?: "Unknown error", e)
        }
    }
    
    /**
     * Get KYC verification status
     * @param userId User ID to check
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    fun getKycStatus(userId: String, promise: Promise) {
        try {
            require(userId.isNotBlank()) { "userId cannot be blank" }
            
            // TODO: Query SDK for verification status
            // Example structure:
            // 1. Call SDK status API
            // 2. Parse response
            // 3. Return status
            
            val status = Arguments.createMap().apply {
                putString("status", "pending") // pending, verified, rejected
                putString("verificationId", "verify_${userId}")
                putDouble("lastUpdated", System.currentTimeMillis().toDouble())
            }
            
            promise.resolve(status)
            
        } catch (e: Exception) {
            promise.reject("KYC_ERROR", e.message ?: "Unknown error", e)
        }
    }
    
    /**
     * Cancel ongoing KYC session
     * @param sessionId Session ID to cancel
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    fun cancelKycSession(sessionId: String, promise: Promise) {
        try {
            require(sessionId.isNotBlank()) { "sessionId cannot be blank" }
            
            // TODO: Cancel SDK session
            
            promise.resolve(true)
            
        } catch (e: Exception) {
            promise.reject("KYC_ERROR", e.message ?: "Unknown error", e)
        }
    }
    
    /**
     * Send event to JS
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    /**
     * Add event listener (required by RN)
     */
    @ReactMethod
    fun addListener(eventName: String) {
        // Setup event listeners if needed
    }
    
    /**
     * Remove event listeners (required by RN)
     */
    @ReactMethod
    fun removeListeners(count: Int) {
        // Cleanup if needed
    }
}

