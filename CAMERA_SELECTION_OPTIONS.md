# Camera Selection Options for Fingerprint Scanning

## Overview

This guide explains different ways to select which camera to use for fingerprint scanning on mobile devices and desktops.

---

## Current Implementation: Default/Primary Camera

**What Changed**: Removed `facingMode` constraint to let the browser choose the primary camera.

```typescript
video: {
  width: { ideal: 640 },
  height: { ideal: 480 },
  // No facingMode - browser uses default/primary camera
}
```

**Behavior**:
- 📱 **Mobile**: Usually opens the back camera (main camera)
- 🖥️ **Desktop**: Opens the default webcam (usually front)
- ✅ Simplest approach - browser decides

---

## All Camera Selection Options

### Option 1: Default/Primary Camera (Current)
**Use Case**: Let the browser/device choose the best camera

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 }
    // No facingMode specified
  }
});
```

**Pros**:
- ✅ Simplest code
- ✅ Works on all devices
- ✅ Browser chooses the best default

**Cons**:
- ❌ Can't control which camera
- ❌ May vary by device/browser

---

### Option 2: Prefer Back Camera
**Use Case**: Prefer back camera but allow fallback

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'environment' // Back camera preferred
  }
});
```

**Pros**:
- ✅ Prefers back camera on mobile
- ✅ Falls back to any camera if back not available
- ✅ Good for fingerprint scanning

**Cons**:
- ❌ Not guaranteed to use back camera

---

### Option 3: Force Back Camera (Strict)
**Use Case**: Must use back camera, fail if not available

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: { exact: 'environment' } // MUST be back camera
  }
});
```

**Pros**:
- ✅ Guaranteed back camera
- ✅ Clear error if not available

**Cons**:
- ❌ Fails on devices without back camera
- ❌ Fails on desktops (usually only front camera)

---

### Option 4: Select Specific Camera by ID
**Use Case**: Let user choose from available cameras

```typescript
// Step 1: Enumerate all cameras
const devices = await navigator.mediaDevices.enumerateDevices();
const videoDevices = devices.filter(device => device.kind === 'videoinput');

console.log('Available cameras:', videoDevices.map(d => ({
  id: d.deviceId,
  label: d.label
})));

// Step 2: Select specific camera
const selectedDeviceId = videoDevices[0].deviceId; // First camera

const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: { exact: selectedDeviceId },
    width: { ideal: 640 },
    height: { ideal: 480 }
  }
});
```

**Pros**:
- ✅ Full control over camera selection
- ✅ Can list all cameras to user
- ✅ Can remember user's preference

**Cons**:
- ❌ More complex code
- ❌ Requires camera permissions first
- ❌ Device IDs change on permissions change

---

### Option 5: Smart Camera Detection
**Use Case**: Automatically select the best camera based on device type

```typescript
async function selectBestCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  
  // Look for back camera keywords
  const backCamera = videoDevices.find(device => 
    device.label.toLowerCase().includes('back') ||
    device.label.toLowerCase().includes('rear') ||
    device.label.toLowerCase().includes('environment')
  );
  
  // If back camera found, use it; otherwise use first available
  const selectedDevice = backCamera || videoDevices[0];
  
  return await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: selectedDevice.deviceId },
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  });
}
```

**Pros**:
- ✅ Intelligent selection
- ✅ Works on various devices
- ✅ Falls back gracefully

**Cons**:
- ❌ Relies on camera labels
- ❌ Labels vary by browser/device

---

## Recommended Implementation for Fingerprint Scanning

### Approach: Default Camera with Fallback

This is what you have now - simple and works everywhere:

```typescript
// src/services/frameCapture.ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 }
    // Browser chooses default camera
  }
});
```

**Why This Works**:
- ✅ Mobile devices: Usually opens back/main camera by default
- ✅ Tablets: Opens back camera
- ✅ Desktops: Opens webcam
- ✅ No complex logic needed
- ✅ Reliable across devices

---

## Advanced: Camera Selector UI (Optional)

If you want users to choose their camera:

### 1. Add Camera Enumeration

```typescript
// Add to FrameCaptureService class
async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'videoinput');
}
```

### 2. Add Initialize with Device ID

```typescript
async initialize(
  videoElement: HTMLVideoElement,
  options: FrameCaptureOptions & { deviceId?: string } = { width: 640, height: 480, fps: 30 }
): Promise<void> {
  // ... existing validation ...
  
  const constraints: MediaStreamConstraints = {
    video: options.deviceId 
      ? {
          deviceId: { exact: options.deviceId },
          width: { ideal: options.width },
          height: { ideal: options.height }
        }
      : {
          width: { ideal: options.width },
          height: { ideal: options.height }
        },
    audio: false
  };
  
  this.stream = await navigator.mediaDevices.getUserMedia(constraints);
  // ... rest of code ...
}
```

### 3. Add Camera Selector Component (Example)

```tsx
// src/components/camera-selector.tsx
import { useState, useEffect } from 'react';

export function CameraSelector({ onSelect }: { onSelect: (deviceId: string) => void }) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        onSelect(videoDevices[0].deviceId); // Select first by default
      }
    });
  }, []);
  
  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      {cameras.map(camera => (
        <option key={camera.deviceId} value={camera.deviceId}>
          {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
        </option>
      ))}
    </select>
  );
}
```

---

## Testing Different Options

### Test on Mobile
```
1. Open app on phone
2. Navigate to fingerprint scan
3. Observe which camera opens
4. Check if it's the back/main camera
```

### Test on Desktop
```
1. Open app on computer
2. Should use webcam (front camera)
3. If you have multiple cameras, may need to select
```

### Test Camera Switching
```javascript
// In browser console:
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('Available cameras:', devices.filter(d => d.kind === 'videoinput'));
});
```

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Default camera | ✅ | ✅ | ✅ | ✅ |
| facingMode | ✅ | ✅ | ✅ | ✅ |
| deviceId selection | ✅ | ✅ | ✅ | ✅ |
| enumerateDevices | ✅ | ✅ | ✅ | ✅ |

**Note**: All require HTTPS (except localhost)

---

## Current Configuration Summary

**File**: `src/services/frameCapture.ts`  
**Lines**: 29-36

**Current Settings**:
```typescript
video: {
  width: { ideal: 640 },
  height: { ideal: 480 }
  // No facingMode - uses default/primary camera
}
```

**Expected Behavior**:
- 📱 **iPhone/Android**: Opens back/main camera
- 💻 **Laptop/Desktop**: Opens default webcam
- 📸 **Tablets**: Opens back camera

---

## Quick Reference

### Want Back Camera Only?
```typescript
facingMode: 'environment'
```

### Want Front Camera?
```typescript
facingMode: 'user'
```

### Want Default Camera? (Current)
```typescript
// No facingMode constraint
```

### Want Specific Camera?
```typescript
deviceId: { exact: 'camera-id-here' }
```

### Want to List All Cameras?
```typescript
const devices = await navigator.mediaDevices.enumerateDevices();
const cameras = devices.filter(d => d.kind === 'videoinput');
```

---

## Troubleshooting

### Issue: Wrong camera opens
**Solution**: Use `facingMode: 'environment'` to prefer back camera

### Issue: Camera permission denied
**Solution**: Check browser settings, ensure HTTPS

### Issue: No camera found
**Solution**: Check device has camera, verify permissions

### Issue: Camera label is empty
**Solution**: Request permissions first, then enumerate

---

## Related Files

- `src/services/frameCapture.ts` - Camera initialization
- `src/components/fingerprint-scan-screen.tsx` - Scan UI

---

## Date
October 11, 2025

## Changelog

### 2025-10-11
- Changed from `facingMode: 'environment'` (back camera) to default camera selection
- Browser now automatically selects primary/main camera
- Documented all camera selection options


