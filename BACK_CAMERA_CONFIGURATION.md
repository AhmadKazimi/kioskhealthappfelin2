# Back Camera Configuration for Mobile Fingerprint Scanning

## Overview

Configured the fingerprint scanning feature to **always use the back camera (rear camera)** on mobile devices instead of the front camera. This is essential for proper fingerprint scanning where users need to place their finger directly on the camera lens.

---

## What Changed

### Camera Facing Mode

**Before** (Front Camera):
```typescript
facingMode: 'user' // Front-facing camera
```

**After** (Back Camera):
```typescript
facingMode: 'environment' // Back/rear-facing camera
```

### Image Mirroring

**Before** (With horizontal flip):
```typescript
// Flip the image horizontally (mirror)
this.context.save();
this.context.scale(-1, 1); // Flip horizontally
this.context.drawImage(
  this.videoElement,
  -this.canvas.width, // Compensate for flip
  0,
  this.canvas.width,
  this.canvas.height
);
this.context.restore();
```

**After** (No flip):
```typescript
// Draw the frame directly (no flip needed for back camera)
this.context.drawImage(
  this.videoElement,
  0,
  0,
  this.canvas.width,
  this.canvas.height
);
```

---

## Why These Changes?

### 1. Back Camera for Fingerprint Scanning
- ✅ Users can place their finger directly on the rear camera lens
- ✅ Better lighting conditions (camera is facing up/out)
- ✅ More natural hand position
- ✅ Standard for fingerprint scanning apps

### 2. No Mirroring Needed
- ✅ Front cameras are typically mirrored for selfies (what you see is what you get)
- ✅ Back cameras show the actual view (no mirroring needed)
- ✅ Removes unnecessary processing
- ✅ Slightly better performance

---

## Browser Compatibility

### Facing Mode Values

| Value | Description | Use Case |
|-------|-------------|----------|
| `'user'` | Front-facing camera | Selfies, video calls |
| `'environment'` | Back-facing camera | **Fingerprint scanning**, document scanning, AR |
| `'left'` | Camera facing left | Specialized use |
| `'right'` | Camera facing right | Specialized use |

### Device Support

✅ **Supported on:**
- iOS Safari (iPhone, iPad)
- Android Chrome
- Android Firefox
- Android Samsung Internet
- Most modern mobile browsers

⚠️ **Desktop behavior:**
- Desktops typically have only front cameras (webcams)
- Will use the available camera (usually front)
- Still works fine for testing

---

## Mobile User Experience

### Physical Setup
```
1. User holds phone horizontally or at an angle
2. User places finger on the back camera lens
3. Camera captures finger through the lens
4. Server detects finger and analyzes vitals
```

### Visual Feedback
- User sees the camera view on screen
- Green badge when finger detected
- Progress bar shows scan progress
- Clear instructions displayed

---

## Testing

### On Mobile Devices

✅ **iPhone/iPad**:
```bash
1. Open app in Safari
2. Navigate to fingerprint scan
3. Grant camera permission
4. Verify back camera activates (not selfie camera)
5. Place finger on back camera lens
6. Verify detection works
```

✅ **Android**:
```bash
1. Open app in Chrome/Firefox
2. Navigate to fingerprint scan
3. Grant camera permission
4. Verify back camera activates
5. Place finger on back camera lens
6. Verify detection works
```

### On Desktop (Testing)
```bash
1. Desktop will use available webcam (usually front-facing)
2. Place finger in front of webcam
3. Detection should still work for testing purposes
```

---

## Fallback Behavior

If a device doesn't support the requested camera:
1. Browser will automatically select the best available camera
2. Error handling in place if no camera available
3. User sees appropriate error message

### getUserMedia Constraints Priority
```javascript
{
  video: {
    facingMode: 'environment', // Preferred: back camera
    width: { ideal: 640 },      // Fallback if back camera not available
    height: { ideal: 480 }      // Browser picks best match
  }
}
```

---

## Code Location

**File**: `src/services/frameCapture.ts`

**Lines changed**:
- Line 33: Changed `facingMode: 'user'` → `facingMode: 'environment'`
- Lines 122-129: Removed horizontal flip, direct draw

---

## Additional Configurations (If Needed)

### Force Exact Camera (More Strict)
```typescript
facingMode: { exact: 'environment' } // Will fail if back camera not available
```

### Prefer Camera But Allow Fallback (Current - Recommended)
```typescript
facingMode: 'environment' // Will use back camera if available, fallback to any camera
```

### Select Specific Camera by ID
```typescript
// First, enumerate devices
const devices = await navigator.mediaDevices.enumerateDevices();
const backCamera = devices.find(d => d.kind === 'videoinput' && d.label.includes('back'));

// Then request specific camera
{
  video: { deviceId: { exact: backCamera.deviceId } }
}
```

---

## Camera Permissions

### iOS Considerations
- iOS requires HTTPS for camera access (except localhost)
- Users must explicitly grant camera permission
- Permission is remembered per domain

### Android Considerations
- Android also requires HTTPS
- Permission is granted per browser
- Some browsers may require repeated permissions

---

## Troubleshooting

### Issue: Front Camera Still Opens
**Solution**: 
- Clear browser cache
- Check device has back camera
- Try on actual mobile device (not emulator)

### Issue: Camera Permission Denied
**Solution**:
- Go to browser settings → Site permissions
- Allow camera for your domain
- Retry scan

### Issue: No Camera Available
**Solution**:
- Verify device has a camera
- Check browser compatibility
- Check HTTPS connection

---

## Performance Impact

| Aspect | Impact |
|--------|--------|
| Camera initialization | No change |
| Frame capture speed | Slightly faster (no mirroring) |
| Image quality | Same |
| Detection accuracy | Same or better |
| Battery usage | Same |

---

## Related Files

- `src/services/frameCapture.ts` - Camera initialization and capture
- `src/components/fingerprint-scan-screen.tsx` - UI component
- `src/services/fingerprintSocketService.ts` - Frame processing

---

## Future Enhancements

Possible future improvements:
1. Allow user to switch between front/back camera
2. Add camera selection dropdown for multi-camera devices
3. Auto-detect best camera based on ambient light
4. Save user's camera preference

---

## References

- [MDN: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: facingMode constraint](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode)

---

## Date
October 11, 2025

