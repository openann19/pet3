# Mobile Security Implementation

This document describes the security features implemented in the PetSpark mobile app.

## Overview

The mobile app includes comprehensive security measures to protect user data and prevent attacks:

1. **Secure Storage** - Encrypted keychain storage for sensitive data
2. **Device Security Checks** - Jailbreak/root detection and tampering checks
3. **Certificate Pinning** - SSL/TLS certificate validation to prevent MITM attacks

## Secure Storage

Location: `src/utils/secure-storage.ts`

### Features

- Type-safe keychain access with configurable accessibility options
- In-memory caching for frequently accessed values (LRU, 5-minute TTL)
- Batch operations support
- Key validation and namespace support
- Size limits and input sanitization
- Retry logic for transient failures
- Comprehensive error handling

### Usage

```typescript
import { saveSecureValue, getSecureValue, deleteSecureValue } from '@/utils/secure-storage'

// Save a value
await saveSecureValue('user_token', 'abc123', {
  keychainAccessible: KeychainAccessibility.WHEN_UNLOCKED,
  requireAuthentication: false,
})

// Get a value
const token = await getSecureValue('user_token')

// Delete a value
await deleteSecureValue('user_token')

// Convenience methods for auth tokens
await saveAuthToken('token')
const token = await getAuthToken()
await deleteAuthToken()
```

### Keychain Accessibility Options

- `WHEN_UNLOCKED` - Accessible when device is unlocked (default)
- `AFTER_FIRST_UNLOCK` - Accessible after first unlock
- `WHEN_UNLOCKED_THIS_DEVICE_ONLY` - Device-specific, when unlocked
- `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` - Device-specific, after first unlock
- `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` - Device-specific, requires passcode

## Device Security Checks

Location: `src/utils/device-security.ts`

### Features

- Jailbreak detection (iOS)
- Root detection (Android)
- Emulator/simulator detection
- Debugger detection
- App tampering detection
- Risk level assessment

### Usage

```typescript
import { performSecurityCheck, isDeviceSecure } from '@/utils/device-security'

// Perform comprehensive security check
const result = await performSecurityCheck({
  allowEmulator: false, // Block emulators in production
  allowDevMode: false,  // Block dev mode in production
})

if (!result.isSecure) {
  console.warn('Security threats detected:', result.threats)
  // Handle security threat
}

// Quick check
const secure = await isDeviceSecure()
```

### Security Threats

The system detects the following threats:

1. **Jailbreak (iOS)** - Critical severity
2. **Root (Android)** - Critical severity
3. **Emulator** - Low severity (acceptable in development)
4. **Debugger** - High severity (in production)
5. **Tampering** - High severity (dev mode in production build)

### Risk Levels

- `low` - No critical threats detected
- `medium` - Some non-critical threats
- `high` - High-severity threats detected
- `critical` - Critical threats detected (jailbreak/root)

## Certificate Pinning

Location: `src/utils/certificate-pinning.ts`

### Features

- SSL/TLS certificate validation
- SHA-256 public key hash validation
- Support for certificate rotation (backup pins)
- Configurable via environment variables

### Configuration

Certificate pins should be configured via environment variables:

```bash
EXPO_PUBLIC_CERT_PINS='[{"hostname":"api.example.com","publicKeyHashes":["sha256/...","sha256/..."],"backupHashes":["sha256/..."]}]'
```

### Usage

```typescript
import { validateCertificateForUrl, setupCertificatePinning } from '@/utils/certificate-pinning'

// Setup during app initialization
await setupCertificatePinning()

// Validate certificate for a URL
const result = await validateCertificateForUrl('https://api.example.com')
if (!result.isValid) {
  console.error('Certificate validation failed:', result.error)
}
```

### Implementation Notes

**Current Status**: Certificate pinning is implemented as a framework, but requires native module integration for full functionality in Expo managed workflow.

**For Production**:

1. **Expo Managed Workflow**:
   - Use `expo-build-properties` to configure network security config (Android)
   - Use Info.plist for App Transport Security (iOS)
   - Consider ejecting or using config plugin for native pinning

2. **Bare React Native**:
   - Use `react-native-ssl-pinning` library
   - Configure pins in native code
   - Set up network security config (Android) and ATS (iOS)

3. **Certificate Pin Format**:
   - SHA-256 hash of public key (preferred)
   - Backup pins for certificate rotation
   - Store pins securely (not in code)

## Security Initialization

Location: `src/utils/security-init.ts`

### Usage

Initialize security during app startup:

```typescript
import { initializeSecurity } from '@/utils/security-init'

// In App.tsx or entry point
const securityResult = await initializeSecurity({
  allowEmulator: __DEV__,     // Allow in development
  allowDevMode: __DEV__,      // Allow in development
  strictMode: false,          // Fail on warnings
})

if (!securityResult.success) {
  console.error('Security initialization failed:', securityResult.errors)
  // Handle initialization failure
}
```

### Periodic Checks

Perform periodic security checks:

```typescript
import { performPeriodicSecurityCheck } from '@/utils/security-init'

// Call periodically (e.g., every 5 minutes)
await performPeriodicSecurityCheck()
```

## API Client Integration

The API client automatically performs security checks in production:

1. **Device Security** - Checks device security before each request
2. **Certificate Validation** - Validates certificates for HTTPS requests

These checks are automatically performed and will block requests if security threats are detected.

## Best Practices

1. **Secure Storage**:
   - Use secure storage for all sensitive data (tokens, passwords, keys)
   - Choose appropriate keychain accessibility based on security requirements
   - Clear sensitive data when user logs out

2. **Device Security**:
   - Perform security checks during app initialization
   - Block critical operations on compromised devices
   - Log security events for monitoring

3. **Certificate Pinning**:
   - Configure pins for all production API endpoints
   - Use backup pins for certificate rotation
   - Test certificate validation in staging environment

4. **Error Handling**:
   - Never expose sensitive security information in error messages
   - Log security events for monitoring and analysis
   - Provide user-friendly error messages when security checks fail

## Testing

### Development Mode

In development, security checks are relaxed:
- Emulators are allowed
- Dev mode is allowed
- Certificate pinning warnings are logged but not enforced

### Production Mode

In production, security checks are strict:
- Emulators are blocked
- Dev mode is blocked
- Certificate pinning is enforced (when implemented)
- All security threats are logged

## Troubleshooting

### Certificate Pinning Not Working

If certificate pinning is not working:

1. Verify certificate pins are configured in environment variables
2. Check that native modules are properly integrated
3. Ensure network security config is set up (Android)
4. Verify App Transport Security settings (iOS)

### Device Security Checks Failing

If device security checks are failing:

1. Verify device is not actually jailbroken/rooted
2. Check if running in emulator (allowed in dev mode)
3. Verify debugger is not attached (allowed in dev mode)
4. Review security check logs for details

### Secure Storage Errors

If secure storage operations fail:

1. Check keychain accessibility settings
2. Verify key format (alphanumeric, underscore, dash, dot only)
3. Check value size (max 2MB)
4. Review error logs for specific error codes

## Security Monitoring

All security events are logged using the app's logging system. In production, consider:

1. Sending security events to monitoring service
2. Alerting on critical security threats
3. Tracking security check failures
4. Monitoring certificate validation failures

## Future Enhancements

1. **Biometric Authentication** - Add biometric authentication for sensitive operations
2. **App Attestation** - Implement app attestation for additional security
3. **Runtime Application Self-Protection (RASP)** - Add runtime protection against attacks
4. **Advanced Tampering Detection** - Enhanced checks for app modification
5. **Network Security Monitoring** - Monitor network traffic for anomalies

