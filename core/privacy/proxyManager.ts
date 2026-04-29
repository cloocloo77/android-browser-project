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
];

export const webViewInjectedPrivacyScript = `
(() => {
  const fakeGetCurrentPosition = (success) => {
    success({ coords: { latitude: 0, longitude: 0, accuracy: 10 }, timestamp: Date.now() });
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = fakeGetCurrentPosition;
  }
  if (window.RTCPeerConnection) {
    const OriginalRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(...args) {
      const pc = new OriginalRTCPeerConnection(...args);
      pc.addEventListener('icecandidate', (event) => {
        if (event && event.candidate && event.candidate.candidate && event.candidate.candidate.includes(' host ')) {
          event.stopImmediatePropagation();
        }
      });
      return pc;
    };
  }
})();
true;
`;
