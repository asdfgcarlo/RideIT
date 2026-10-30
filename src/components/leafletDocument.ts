import { carouselRoutes } from '../data/carouselRoutes';

export type MapPosition = { latitude: number; longitude: number; accuracy: number | null };
export type LeafletMapProps = { position: MapPosition | null; recenter: number };

// Kept stable so GPS updates move the marker without reloading the map.
export const leafletDocument = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
 integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>html,body,#map{height:100%;margin:0}body{background:#e8e5ed;font-family:Arial}
#notice{position:absolute;top:12px;left:50px;right:12px;z-index:1000;background:white;padding:10px;border-radius:8px;font-size:13px}
.leaflet-control-attribution{font-size:10px}</style></head>
<body><div id="map" role="region" aria-label="Live location map"></div><div id="notice">Loading map…</div>
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
 const directionControl=L.control({position:'bottomleft'});
 directionControl.onAdd=function(){
  const panel=L.DomUtil.create('div');
  panel.style.cssText='background:white;padding:8px;border-radius:8px;box-shadow:0 1px 5px #777;font-size:12px;max-width:240px';
  const select=document.createElement('select');
  select.setAttribute('aria-label','Route direction');
  select.style.cssText='min-height:44px;width:100%;font-size:13px;background:white;color:#241b38';
  [['northbound','Northbound: PITX to Monumento'],['southbound','Southbound: Monumento to PITX']].forEach(function(item){
   const option=document.createElement('option');option.value=item[0];option.textContent=item[1];select.appendChild(option);
  });
  select.onchange=function(){showRoute(select.value);};
  panel.appendChild(select);
  const hint=document.createElement('div');hint.textContent='24 stations · Tap a marker for its name';panel.appendChild(hint);
  const overview=document.createElement('button');overview.textContent='Show full route';
  overview.style.cssText='min-height:44px;width:100%;margin-top:4px';
  overview.onclick=function(){showRoute(activeDirection);};panel.appendChild(overview);
  L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
  return panel;
 };
 directionControl.addTo(map);
 function showRoute(direction){
  activeDirection=direction;
  follow=false;
  routeLayer.clearLayers();
  const route=routes[direction];
  const color=direction==='northbound'?'#7c3aed':'#dc2626';
  const line=L.polyline(route.path,{color:color,weight:5,opacity:0.85}).addTo(routeLayer);
  route.stations.forEach(function(station,index){
   const label=document.createElement('div');
   label.textContent=(index+1)+'. '+station.name+' ('+direction+')';
   L.circleMarker([station.lat,station.lng],{radius:7,color:color,weight:3,fillColor:'#fff',fillOpacity:1})
    .addTo(routeLayer).bindPopup(label).bindTooltip(station.name);
  });
  map.fitBounds(line.getBounds(),{paddingTopLeft:[20,20],paddingBottomRight:[20,130],animate:false});
 }
 showRoute(activeDirection);
 map.on('dragstart',function(){follow=false;});
 window.updateRideITLocation=function(data){
  const p=data.position;
  if(!p){if(marker)map.removeLayer(marker);if(circle)map.removeLayer(circle);marker=null;circle=null;follow=true;return;}
  if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;
  const latlng=[p.latitude,p.longitude];
  const first=!marker;
  if(first){
   circle=L.circle(latlng,{radius:Math.max(0,p.accuracy||0),color:'#2563eb',weight:1,fillOpacity:0.12}).addTo(map);
   marker=L.circleMarker(latlng,{radius:9,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}).addTo(map).bindPopup('You are here');
  }else{marker.setLatLng(latlng);circle.setLatLng(latlng).setRadius(Math.max(0,p.accuracy||0));}
  if(data.recenter!==lastRecenter){follow=true;lastRecenter=data.recenter;}
  if(first||follow)map.setView(latlng,first?16:map.getZoom(),{animate:false});
 };
 window.addEventListener('message',function(event){
  if(event.source!==window.parent)return;
  if(event.data&&event.data.rideitLocation)window.updateRideITLocation(event.data.rideitLocation);
 });
 report('ready');
}
</script></body></html>`;
