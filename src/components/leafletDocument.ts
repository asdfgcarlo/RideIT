import { carouselRoutes } from '../data/carouselRoutes';

export type MapPosition = { latitude: number; longitude: number; accuracy: number | null };
export type RouteDirection = 'northbound' | 'southbound';
export type TripDestination = { name: string; lat: number; lng: number };
export type LeafletMapProps = { position: MapPosition | null; recenter: number; direction: RouteDirection; overview: number; destination: TripDestination | null };

// Kept stable so GPS updates move the marker without reloading the map.
export const leafletDocument = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
 integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>html,body,#map{height:100%;margin:0}body{background:#e8e5ed;font-family:Arial}
#notice{position:absolute;top:12px;left:50px;right:12px;z-index:1000;background:white;padding:10px;border-radius:8px;font-size:13px}
.leaflet-control-attribution{font-size:10px}</style></head>
<body><div id="map" role="region" aria-label="Live location map"></div><div id="notice">Loading map...</div>
<script>
function report(type){
 if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(type);
 else window.parent.postMessage({rideitMap:type}, '*');
}
window.mapLoadFailed=function(){document.getElementById('notice').textContent='Map unavailable. Check your internet connection and tap Reload map.';report('error');};
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
 integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="" onerror="mapLoadFailed()"></script>
<script>
if(window.L){
 const notice=document.getElementById('notice');
 const map=L.map('map').setView([14.5995,120.9842],12);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
 }).addTo(map);
 notice.style.display='none';
 tiles.on('tileerror',function(){notice.textContent='Map tiles unavailable. Check your internet connection.';notice.style.display='block';});
 tiles.on('tileload',function(){notice.style.display='none';});
 let marker=null,circle=null,follow=true,lastRecenter=-1;
 const routes=${JSON.stringify(carouselRoutes)};
 const routeLayer=L.layerGroup().addTo(map);
 let activeDirection='northbound';
 let lastOverview=0;
 let destinationMarker=null,lastDestination='';
 function showRoute(direction){
  activeDirection=direction;
  follow=false;
  routeLayer.clearLayers();
  const route=routes[direction];
  const color=direction==='northbound'?'#0c09ce':'#a50909';
  const line=L.polyline(route.path,{color:color,weight:5,opacity:0.85}).addTo(routeLayer);
  route.stations.forEach(function(station,index){
   const label=document.createElement('div');
   label.textContent=(index+1)+'. '+station.name+' ('+direction+')';
   L.circleMarker([station.lat,station.lng],{radius:7,color:color,weight:3,fillColor:'#fff',fillOpacity:1})
    .addTo(routeLayer).bindPopup(label).bindTooltip(station.name);
  });
  map.fitBounds(line.getBounds(),{paddingTopLeft:[20,20],paddingBottomRight:[20,20],animate:false});
 }
 showRoute(activeDirection);
 map.on('dragstart',function(){follow=false;});
 window.updateRideITLocation=function(data){
  const directionChanged=!!routes[data.direction] && data.direction!==activeDirection;
  const overviewChanged=Number.isFinite(data.overview) && data.overview!==lastOverview;
  if(overviewChanged)lastOverview=data.overview;
  if(directionChanged||overviewChanged)showRoute(routes[data.direction]?data.direction:activeDirection);
  const destination=data.destination;
  const destinationKey=JSON.stringify(destination||null);
  const destinationChanged=destinationKey!==lastDestination;
  if(destinationChanged){
   lastDestination=destinationKey;
   if(destinationMarker)map.removeLayer(destinationMarker);
   destinationMarker=null;
   if(destination && Number.isFinite(destination.lat) && Number.isFinite(destination.lng)){
    const label=document.createElement('div');label.textContent='Trip endpoint: '+destination.name;
    const tooltip=document.createElement('span');tooltip.textContent='END: '+destination.name;
    destinationMarker=L.circleMarker([destination.lat,destination.lng],{radius:12,color:'#241b38',weight:3,fillColor:'#facc15',fillOpacity:1})
     .addTo(map).bindPopup(label).bindTooltip(tooltip,{permanent:true,direction:'top',offset:[0,-12]});
    if(!overviewChanged){follow=false;map.setView([destination.lat,destination.lng],15,{animate:false});}
   }
  }
  const p=data.position;
  if(!p){if(marker)map.removeLayer(marker);if(circle)map.removeLayer(circle);marker=null;circle=null;return;}
  if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;
  const latlng=[p.latitude,p.longitude];
  const first=!marker;
  if(first){
   circle=L.circle(latlng,{radius:Math.max(0,p.accuracy||0),color:'#2563eb',weight:1,fillOpacity:0.12}).addTo(map);
   marker=L.circleMarker(latlng,{radius:5,color:'#000000',weight:3,fillColor:'#000000',fillOpacity:1}).addTo(map).bindPopup('You are here');
  }else{marker.setLatLng(latlng);circle.setLatLng(latlng).setRadius(Math.max(0,p.accuracy||0));}
  if(first&&!destination&&!overviewChanged&&!directionChanged)follow=true;
  if(data.recenter!==lastRecenter){if(lastRecenter!==-1 || !destination)follow=true;lastRecenter=data.recenter;}
  if(!directionChanged&&!overviewChanged&&!destinationChanged&&follow)map.setView(latlng,first?16:map.getZoom(),{animate:false});
 };
 window.addEventListener('message',function(event){
  if(event.source!==window.parent)return;
  if(event.data&&event.data.rideitLocation)window.updateRideITLocation(event.data.rideitLocation);
 });
 report('ready');
}
</script></body></html>`;

