import { ProxyProfile } from '../../types/browser';

export const defaultProfiles: ProxyProfile[] = [
  {
    id: 'none',
    name: 'Direct Connection',
    host: '',
    port: 0,
    region: 'Local',
    timezone: 'UTC',
    geoLat: 0,
    geoLng: 0,
  },
  {
    id: 'us-east',
    name: 'US East Profile',
    host: '127.0.0.1',
    port: 8888,
    region: 'US-East',
    timezone: 'America/New_York',
    geoLat: 40.7128,
    geoLng: -74.006,
  },
];

export const buildPrivacyScript = (profile: ProxyProfile) => `
(() => {
  const FAKE_LAT = ${profile.geoLat};
  const FAKE_LNG = ${profile.geoLng};
  const TZ = '${profile.timezone}';
  const fakeGetCurrentPosition = (success) => {
    success({ coords: { latitude: FAKE_LAT, longitude: FAKE_LNG, accuracy: 15 }, timestamp: Date.now() });
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = fakeGetCurrentPosition;
    navigator.geolocation.watchPosition = (success) => {
      fakeGetCurrentPosition(success);
      return 1;
    };
  }
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  Intl.DateTimeFormat.prototype.resolvedOptions = function(...args) {
    const options = originalResolvedOptions.apply(this, args);
    return { ...options, timeZone: TZ };
  };
  if (window.RTCPeerConnection) {
    const OriginalRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(...args) {
      const pc = new OriginalRTCPeerConnection(...args);
      pc.addEventListener('icecandidate', (event) => {
        if (event?.candidate?.candidate?.includes(' host ')) {
          event.stopImmediatePropagation();
        }
      });
      return pc;
    };
  }
})();
true;
`;
