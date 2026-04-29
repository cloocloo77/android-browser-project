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
  const makePosition = () => ({
    coords: { latitude: 0, longitude: 0, accuracy: 10 },
    timestamp: Date.now(),
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = (success, error) => {
      try {
        success && success(makePosition());
      } catch (err) {
        error && error(err);
      }
    };

    navigator.geolocation.watchPosition = (success) => {
      success && success(makePosition());
      return 1;
    };

    navigator.geolocation.clearWatch = () => undefined;
  }

  if (window.RTCPeerConnection) {
    const OriginalRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(...args) {
      const pc = new OriginalRTCPeerConnection(...args);
      const originalAddIceCandidate = pc.addIceCandidate?.bind(pc);

      pc.addEventListener('icecandidate', (event) => {
        const candidate = event?.candidate?.candidate;
        if (candidate && candidate.includes(' host ')) {
          event.stopImmediatePropagation();
        }
      });

      if (originalAddIceCandidate) {
        pc.addIceCandidate = (candidate, ...rest) => {
          const candidateString = candidate?.candidate ?? '';
          if (candidateString.includes(' host ')) {
            return Promise.resolve();
          }
          return originalAddIceCandidate(candidate, ...rest);
        };
      }

      return pc;
    };
  }
})();
true;
`;
