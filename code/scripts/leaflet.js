mdlr('[web]scripts:leaflet-map', m => {

  const { scripts } = m.require('utils:load-script');

  m.html`
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
  <div{} />`;

  m.style`
    display: block;
    position: absolute;
    height:100%;
    width:100%;
    max-width: 100%;
    max-height: 100%;
  `;

  return class {
    div;

    connected(e) {
      scripts([
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js",
      ], error => {
        if (error) return console.log(error);

        const map = L.map(e).setView([51.505, -0.09], 13);

        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const marker = L.marker([51.5, -0.09]).addTo(map)
          .bindPopup('<b>Hello world!</b><br />I am a popup.').openPopup();

        const circle = L.circle([51.508, -0.11], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 500
        }).addTo(map).bindPopup('I am a circle.');

        const polygon = L.polygon([
          [51.509, -0.08],
          [51.503, -0.06],
          [51.51, -0.047]
        ]).addTo(map).bindPopup('I am a polygon.');


        const popup = L.popup()
          .setLatLng([51.513, -0.09])
          .setContent('I am a standalone popup.')
          .openOn(map);

        function onMapClick(e) {
          popup
            .setLatLng(e.latlng)
            .setContent(`You clicked the map at ${e.latlng.toString()}`)
            .openOn(map);
        }

        map.on('click', onMapClick);
      });
    }

  }

})