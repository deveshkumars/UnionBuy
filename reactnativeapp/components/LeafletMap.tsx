/**
 * LeafletMap Component
 * Interactive map using Leaflet - works on both mobile (WebView) and web (iframe)
 */

import React, { useRef, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Location, Store, MissionStatus } from '@/types';

// Only import WebView on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface LeafletMapProps {
  stores: Store[];
  dropZone: Location;
  runnerPosition?: Location;
  userLocation?: Location;
  customerLocations?: Location[]; // All customers in the order (for K-means visualization)
  missionStatus?: MissionStatus;
  style?: object;
}

export default function LeafletMap({
  stores,
  dropZone,
  runnerPosition,
  userLocation,
  customerLocations,
  missionStatus,
  style,
}: LeafletMapProps) {
  const webViewRef = useRef<any>(null);

  // Calculate center point from all locations
  const allLats = [...stores.map(s => s.location.latitude), dropZone.latitude];
  const allLngs = [...stores.map(s => s.location.longitude), dropZone.longitude];
  const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
  const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

  // Build the route coordinates for the polyline
  const routeCoords = [
    ...(runnerPosition ? [[runnerPosition.latitude, runnerPosition.longitude]] : []),
    ...stores.map(s => [s.location.latitude, s.location.longitude]),
    [dropZone.latitude, dropZone.longitude],
  ];

  // Build waypoints for OSRM: runner -> stores -> dropzone
  const waypoints = [
    ...(runnerPosition ? [`${runnerPosition.longitude},${runnerPosition.latitude}`] : []),
    ...stores.map(s => `${s.location.longitude},${s.location.latitude}`),
    `${dropZone.longitude},${dropZone.latitude}`,
  ].join(';');

  const html = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }

    /* Store marker - Uber style pin */
    .store-marker {
      background: #276EF1;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .store-marker.visited {
      background: #05944F;
    }

    /* Drop zone - destination marker */
    .dropzone-marker {
      width: 44px;
      height: 44px;
      background: #05944F;
      border: 4px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      animation: destinationPulse 2s infinite;
    }

    .dropzone-inner {
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
    }

    /* Runner marker - car/person indicator */
    .runner-marker {
      width: 40px;
      height: 40px;
      background: #000;
      border: 3px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }

    .runner-inner {
      font-size: 18px;
    }

    /* User location - blue pulsing dot (like Uber "You are here") */
    .user-marker {
      width: 24px;
      height: 24px;
      background: #276EF1;
      border: 4px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(39,110,241,0.4);
      position: relative;
    }

    .user-marker::after {
      content: '';
      position: absolute;
      top: -8px;
      left: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(39,110,241,0.2);
      animation: userPulse 2s infinite;
    }

    @keyframes userPulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.5); opacity: 0; }
    }

    /* Customer markers (small dots showing all customers in order) */
    .customer-marker {
      width: 12px;
      height: 12px;
      background: #8B5CF6;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(139,92,246,0.4);
    }

    /* Cluster radius indicator */
    .cluster-radius {
      border: 2px dashed rgba(5,148,79,0.4);
      border-radius: 50%;
      background: rgba(5,148,79,0.05);
    }

    @keyframes destinationPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 2px 12px rgba(5,148,79,0.3); }
      50% { transform: scale(1.05); box-shadow: 0 2px 20px rgba(5,148,79,0.5); }
    }

    /* Popup styling - clean Uber style */
    .leaflet-popup-content-wrapper {
      background: #fff;
      color: #000;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      padding: 0;
    }

    .leaflet-popup-content {
      margin: 12px 16px;
    }

    .leaflet-popup-tip {
      background: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .popup-title {
      color: #000;
      font-weight: 600;
      font-size: 14px;
    }

    .popup-address {
      color: #6B6B6B;
      font-size: 12px;
      margin-top: 4px;
    }

    /* Route info badge */
    .route-info {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: #fff;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #000;
      z-index: 1000;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .route-info span {
      color: #276EF1;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="route-info" class="route-info" style="display: none;"></div>
  <script>
    // Clean light map style (Uber-like)
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], 12);

    // CartoDB Voyager - clean, minimal style like Uber
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Fallback straight-line coords
    const fallbackCoords = ${JSON.stringify(routeCoords)};

    // Fetch real driving route from OSRM
    async function fetchRoute() {
      const waypoints = '${waypoints}';
      const url = 'https://router.project-osrm.org/route/v1/driving/' + waypoints + '?overview=full&geometries=geojson';

      let allBounds = [];

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); // Convert [lng,lat] to [lat,lng]
          allBounds = [...coords];

          // Draw route shadow first
          L.polyline(coords, {
            color: '#000',
            weight: 8,
            opacity: 0.15
          }).addTo(map);

          // Draw the runner's route (Uber blue)
          L.polyline(coords, {
            color: '#276EF1',
            weight: 5,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          // Show route info
          const distance = (route.distance / 1609.34).toFixed(1); // meters to miles
          const duration = Math.round(route.duration / 60); // seconds to minutes

          // Also fetch user's route to drop zone if user location exists
          ${userLocation ? `
          const userRouteUrl = 'https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};' + dropZone.lng + ',' + dropZone.lat + '?overview=full&geometries=geojson';
          try {
            const userResponse = await fetch(userRouteUrl);
            const userData = await userResponse.json();

            if (userData.code === 'Ok' && userData.routes && userData.routes.length > 0) {
              const userRoute = userData.routes[0];
              const userCoords = userRoute.geometry.coordinates.map(c => [c[1], c[0]]);
              allBounds = [...allBounds, ...userCoords];

              // Draw user's route to drop zone (green, dashed)
              L.polyline(userCoords, {
                color: '#05944F',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 6',
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);

              // Update info with both routes
              const userDist = (userRoute.distance / 1609.34).toFixed(1);
              const userDur = Math.round(userRoute.duration / 60);
              const infoEl = document.getElementById('route-info');
              infoEl.innerHTML = 'Runner: <span>' + distance + '</span> mi · <span>' + duration + '</span> min<br/>You to pickup: <span style="color:#05944F">' + userDist + '</span> mi · <span style="color:#05944F">' + userDur + '</span> min';
              infoEl.style.display = 'block';
            } else {
              const infoEl = document.getElementById('route-info');
              infoEl.innerHTML = 'Runner: <span>' + distance + '</span> mi · <span>' + duration + '</span> min';
              infoEl.style.display = 'block';
            }
          } catch (e) {
            const infoEl = document.getElementById('route-info');
            infoEl.innerHTML = 'Runner: <span>' + distance + '</span> mi · <span>' + duration + '</span> min';
            infoEl.style.display = 'block';
          }
          ` : `
          const infoEl = document.getElementById('route-info');
          infoEl.innerHTML = '<span>' + distance + '</span> mi · <span>' + duration + '</span> min drive';
          infoEl.style.display = 'block';
          `}

          // Fit map to show all routes
          if (allBounds.length > 0) {
            map.fitBounds(L.latLngBounds(allBounds), { padding: [50, 50] });
          }
        } else {
          // Fallback to straight lines
          drawFallbackRoute();
        }
      } catch (err) {
        console.error('OSRM error:', err);
        drawFallbackRoute();
      }
    }

    function drawFallbackRoute() {
      if (fallbackCoords.length > 1) {
        L.polyline(fallbackCoords, {
          color: '#276EF1',
          weight: 4,
          opacity: 0.6,
          dashArray: '8, 12'
        }).addTo(map);

        ${userLocation ? `
        // Draw fallback user route (straight line)
        L.polyline([[${userLocation.latitude}, ${userLocation.longitude}], [dropZone.lat, dropZone.lng]], {
          color: '#05944F',
          weight: 3,
          opacity: 0.6,
          dashArray: '8, 12'
        }).addTo(map);
        ` : ''}

        map.fitBounds(L.latLngBounds(fallbackCoords), { padding: [30, 30] });
      }
    }

    // Store markers
    const stores = ${JSON.stringify(stores.map((s, i) => ({
      lat: s.location.latitude,
      lng: s.location.longitude,
      name: s.name,
      address: s.location.address || '',
      index: i + 1,
    })))};

    stores.forEach((store, idx) => {
      const visited = ${missionStatus ? `['shopping', 'checkout', 'en_route_to_dropzone', 'distributing', 'completed'].includes('${missionStatus}')` : 'false'};

      const icon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="store-marker ' + (visited ? 'visited' : '') + '">' + store.index + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker([store.lat, store.lng], { icon })
        .addTo(map)
        .bindPopup('<div class="popup-title">' + store.name + '</div><div class="popup-address">' + store.address + '</div>');
    });

    // Drop zone marker
    const dropZone = ${JSON.stringify({
      lat: dropZone.latitude,
      lng: dropZone.longitude,
      address: dropZone.address || 'Drop Zone',
    })};

    const dropIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="dropzone-marker"><div class="dropzone-inner"></div></div>',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });

    L.marker([dropZone.lat, dropZone.lng], { icon: dropIcon })
      .addTo(map)
      .bindPopup('<div class="popup-title">DROP ZONE</div><div class="popup-address">' + dropZone.address + '</div>');

    // Customer location markers (purple dots showing all customers in order)
    ${customerLocations && customerLocations.length > 0 ? `
    const customerLocs = ${JSON.stringify(customerLocations)};
    customerLocs.forEach((loc, idx) => {
      const customerIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="customer-marker"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      L.marker([loc.latitude, loc.longitude], { icon: customerIcon })
        .addTo(map)
        .bindPopup('<div class="popup-title">Customer ' + (idx + 1) + '</div><div class="popup-address">Order participant</div>');
    });

    // Draw lines from each customer to drop zone to visualize K-means
    customerLocs.forEach(loc => {
      L.polyline([[loc.latitude, loc.longitude], [dropZone.lat, dropZone.lng]], {
        color: '#8B5CF6',
        weight: 1,
        opacity: 0.3,
        dashArray: '4, 4'
      }).addTo(map);
    });
    ` : ''}

    // User location marker (blue dot - "You are here")
    ${userLocation ? `
    const userIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="user-marker"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="popup-title">You</div><div class="popup-address">Your location</div>');
    ` : ''}

    // Runner marker (car icon)
    ${runnerPosition ? `
    const runnerIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="runner-marker"><div class="runner-inner">🚗</div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    L.marker([${runnerPosition.latitude}, ${runnerPosition.longitude}], { icon: runnerIcon })
      .addTo(map)
      .bindPopup('<div class="popup-title">Your Runner</div><div class="popup-address">En route to drop zone</div>');
    ` : ''}

    // Fetch and draw the route
    fetchRoute();
  </script>
</body>
</html>
`, [stores, dropZone, runnerPosition, userLocation, customerLocations, missionStatus, centerLat, centerLng, routeCoords, waypoints]);

  // Web: use iframe
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#f5f5f5',
          }}
        />
      </View>
    );
  }

  // Native: use WebView
  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
