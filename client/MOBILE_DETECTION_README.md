# Mobile Detection & Playlist Controls

This document explains how mobile detection works in the Spotify Vibe Generator app and how to use it.

## Overview

The app automatically detects whether the user is on a mobile device or desktop and adjusts the user interface accordingly, particularly for playlist interactions.

## How Mobile Detection Works

### 1. Screen Size Detection
- Devices with width ≤ 768px are considered small screens
- This is the primary indicator for mobile devices

### 2. Touch Capability Detection
- Checks if the device supports touch events (`ontouchstart`)
- Checks for maximum touch points (`navigator.maxTouchPoints`)

### 3. Pointer Capability Detection
- **Fine pointer**: Mouse devices (desktop)
- **Coarse pointer**: Touch devices (mobile/tablet)

### 4. Mobile Device Criteria
A device is considered mobile if:
- Screen width ≤ 768px **OR**
- Has touch capabilities but no mouse

## Mobile vs Desktop Behavior

### Desktop Devices
- Playlist controls appear on **hover**
- Controls remain visible while hovering
- No automatic hiding

### Mobile Devices
- Playlist controls are **hidden by default**
- Controls appear on **tap** for **3 seconds**
- Controls automatically hide after 3 seconds
- Visual indicator shows "3s" countdown

## Implementation in Components

### Using the `isMobile` State Variable

```jsx
// In your component
const [isMobile, setIsMobile] = useState(false);

// Use it to conditionally render different UI
{isMobile ? (
  <MobileVersion />
) : (
  <DesktopVersion />
)}
```

### Using the `isDeviceMobile()` Function

```jsx
// Real-time device detection
const handleClick = () => {
  if (isDeviceMobile()) {
    // Mobile-specific logic
    handleMobileAction();
  } else {
    // Desktop-specific logic
    handleDesktopAction();
  }
};
```

### Using the Utility Functions

```jsx
import { 
  isMobileDevice, 
  hasTouchCapability, 
  hasMouseCapability,
  getDeviceType 
} from '../utils/deviceDetection';

// Check device capabilities
if (hasTouchCapability()) {
  // Device supports touch
}

if (hasMouseCapability()) {
  // Device has mouse
}

const deviceType = getDeviceType(); // 'mobile', 'tablet', or 'desktop'
```

### Using the Custom Hook

```jsx
import { useDeviceDetection } from '../utils/deviceDetection';

function MyComponent() {
  const { 
    isMobile, 
    deviceType, 
    screenDimensions 
  } = useDeviceDetection();

  return (
    <div>
      {isMobile ? 'Mobile View' : 'Desktop View'}
      <p>Device Type: {deviceType}</p>
      <p>Screen: {screenDimensions.width}x{screenDimensions.height}</p>
    </div>
  );
}
```

## Playlist Controls Implementation

### State Variables
```jsx
const [mobilePlaylistControlsIndex, setMobilePlaylistControlsIndex] = useState(null);
const [hoveredPlaylistIndex, setHoveredPlaylistIndex] = useState(null);
```

### Mobile Press Handler
```jsx
const handleMobilePlaylistPress = (idx) => {
  // Clear existing timer
  if (mobileControlsTimerRef.current) {
    clearTimeout(mobileControlsTimerRef.current);
  }
  
  // Show controls
  setMobilePlaylistControlsIndex(idx);
  
  // Hide after 3 seconds
  mobileControlsTimerRef.current = setTimeout(() => {
    setMobilePlaylistControlsIndex(null);
  }, 3000);
};
```

### Click Handler
```jsx
onClick={() => {
  // Handle mobile press to show controls (only on mobile)
  if (isMobile) {
    handleMobilePlaylistPress(idx);
  }
  
  // Open Spotify playlist if available
  if (playlist.external_urls?.spotify) {
    window.open(playlist.external_urls.spotify, '_blank');
  }
}}
```

### Hover Handlers (Desktop Only)
```jsx
onMouseEnter={() => setHoveredPlaylistIndex(idx)}
onMouseLeave={() => setHoveredPlaylistIndex(null)}
```

### Controls Visibility
```jsx
opacity: (hoveredPlaylistIndex === idx || mobilePlaylistControlsIndex === idx) ? 1 : 0,
pointerEvents: (hoveredPlaylistIndex === idx || mobilePlaylistControlsIndex === idx) ? 'auto' : 'none',
```

## Mobile Controls Visual Indicator

When mobile controls are active, a small "3s" indicator appears in the top-right corner of the playlist:

```jsx
{/* Mobile controls indicator */}
{mobilePlaylistControlsIndex === idx && (
  <div style={{
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#1db954',
    color: '#000',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    animation: 'pulse 1s infinite',
  }}>
    3s
  </div>
)}
```

## CSS Animations

The app includes CSS animations for mobile controls:

```css
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

## Best Practices

1. **Always check `isMobile` before implementing mobile-specific behavior**
2. **Use the utility functions for real-time detection**
3. **Implement both hover (desktop) and tap (mobile) interactions**
4. **Provide visual feedback for mobile interactions**
5. **Test on both mobile and desktop devices**

## Troubleshooting

### Controls not appearing on mobile
- Check if `isMobile` state is correctly set
- Verify the click handler is calling `handleMobilePlaylistPress`
- Ensure the timer is not being cleared prematurely

### Controls not hiding after 3 seconds
- Check if `mobileControlsTimerRef.current` is properly set
- Verify the cleanup function in useEffect

### Hover not working on desktop
- Check if `isMobile` is false
- Verify `onMouseEnter` and `onMouseLeave` handlers
- Ensure `hoveredPlaylistIndex` state is being updated

## Testing

To test mobile detection:
1. Use browser dev tools to simulate mobile devices
2. Test touch events on actual mobile devices
3. Verify orientation changes work correctly
4. Check that resize events update the detection state
