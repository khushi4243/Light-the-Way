mapboxgl.accessToken = "pk.eyJ1Ijoic29tc3ViaHJhMSIsImEiOiJja2hkbDhuNGcwNnZnMnNuMGkwcjU3d3UwIn0.ZAeP5aPO4JkxNGD7dIEZtw";

const successLocation = (position) => {

  setupMap([position.coords.longitude, position.coords.latitude]);
};

const errorLocation = () => {
  setupMap([-71.0875, 42.3367]);
};

var streetlights;

const setupMap = (center) => {
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    zoom: 16,
    center,
  });

  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav);


  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
  });

  map.addControl(directions, "top-left");


  Papa.parse('streetlight-locations.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: function(results) {
      console.log(results);
      streetlights = results.data;

      map.on('style.load', function() {
        const lightArray = [];

        streetlights.forEach(light => {
          const lat = light.Lat;
          const long = light.Long;

          const feature = {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates:[long, lat]
            }
          };

          lightArray.push(feature);
        });

          map.addSource('streetlights-1', {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: lightArray
            }
          })

          // Add a layer to the map that displays the streetlights as circles
          map.addLayer({
            id: "streetlights",
            type: "circle",
            source:  "streetlights-1",
            paint: {
              "circle-color": "#000000",
              "circle-radius": 1
            }
          });
        });
    } 
  });

  setupClickListener(map);
};

let clickListenerIsSetUp = false;
  function setupClickListener(map){
    map.on('click', function(e) {
      if(clickListenerIsSetUp) return;
      
      const startLocation = e.lngLat.wrap();
      const endLocation = e.lngLat.wrap();
      
      // Send an HTTP GET request to the Mapbox Directions API
      const requestUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${startLocation},${endLocation}?access_token=${mapboxgl.accessToken}&optimization=streetlights&annotations=ligh&radiuses=${50}`;
      
      let maxStreetlights = 0;
      let bestRoute;
      
     
      fetch(requestUrl)
        .then(response => response.json())
        .then(data => {

          data.routes.forEach(route => {
         
            let streetlightCount = 0;
            

            route.legs.forEach(leg => {

              leg.steps.forEach(step => {
                
                const RADIUS_OF_EARTH_IN_METERS = 6371000;

                Math.radians = function (degrees) {
                  return (degrees * Math.PI) / 180;
                };
                
                Math.degrees = function (radians) {
                  return (radians * 180) / Math.PI;
                };
                
                // finc the distance between each latitude and longitude value
                function getDistance(lat1, lon1, lat2, lon2) {
                  const lat1Rad = Math.radians(lat1);
                  const lon1Rad = Math.radians(lon1);
                  const lat2Rad = Math.radians(lat2);
                  const lon2Rad = Math.radians(lon2);
                
                  const latDiff = lat2Rad - lat1Rad;
                  const lonDiff = lon2Rad - lon1Rad;
                
                  const a =
                    Math.sin(latDiff / 2) ** 2 +
                    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDiff / 2) ** 2;
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                
                  return RADIUS_OF_EARTH_IN_METERS * c;
                }
                
                // count the amount of streetlights within a particular radius
                function getStreetlightsInRadius(location, radius) {
                  let streetlightCount = 0;
                  streetlights.forEach((light) => {
                    const distance = getDistance(
                      location[1],
                      location[0],
                      light.Lat,
                      light.Long
                    );
                    if (distance <= radius) {
                      streetlightCount++;
                    }
                  });
                  return streetlightCount;
                }

                const streetlightsInRadius = getStreetlightsInRadius(step.maneuver.location, 50);

                streetlightCount += streetlightsInRadius;
              });
            });
            
            if (streetlightCount > maxStreetlights) {
              maxStreetlights = streetlightCount;
              bestRoute = route;
            }
          });
          
        
          function plotRouteOnMap(route) {
      
            const routeGeometry = route.geometry;

            map.addLayer({
              id: 'route',
              type: 'line',
              source: {
                type: 'geojson',
                data: routeGeometry
              },
              paint: {
                'line-color': '#ff0000',
                'line-width': 5
              }
            });
            
            map.fitBounds(routeGeometry.bounds, {
              padding: 50
            });
          }
          plotRouteOnMap(bestRoute);
        })
        .catch(error => {
          console.error(error);
        });
      })
    };      
  
  clickListenerIsSetUp = true;
  setupMap([-71.0875, 42.3367]);

      






// navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
//   enableHighAccuracy: true,
// });

// document.addEventListener('DOMContentLoaded', function() {
//   const form = document.getElementById('route-form');

//   let isFetching = false; 

//   form.addEventListener('submit', function(event) {
//     event.preventDefault(); // Prevent the form from being submitted

//     if(isFetching) {
//       return;
//     }

//     isFetching = true;

//     // Get the start and end locations from the form
//     const startLocation = document.getElementById('start-location').value;
//     const endLocation = document.getElementById('end-location').value;

//     // Send an HTTP GET request to the Mapbox Directions API
//     const requestUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${startLocation},${endLocation}?access_token=${mapboxgl.accessToken}&optimization=streetlights&annotations=ligh&radiuses=${50}`;

//     fetch(requestUrl)
//       .then(response => response.json())
//       .then(data => {
//         // Do something with the response data
//       })
//       .catch(error => {
//         console.error(error);
//       });
//   });
// });

// -71.09143,42.33586
// -71.07640,42.33629



// Papa.parse('streetlight-locations.csv', {
//     header: true,
//     complete: function(results) {
//       const streetlights = results.data;
//       console.log(streetlights);
//       streetlights.forEach(light => {
//         const lat = light.Lat;
//         const long = light.Long;
        
//         // Add a layer to the map that displays the streetlights as circles
//         map.addLayer({
//           id: "streetlights",
//           type: "circle",
//           source: {
//             type: "geojson",
//             data: {
//               type: "FeatureCollection",
//               features: [
//                 {
//                   type: "Feature",
//                   geometry: {
//                     type: "Point",
//                     coordinates: [long, lat]
//                   }
//                 }
//               ]
//             }
//           },
//           paint: {
//             "circle-color": "#000000",
//             "circle-radius": 50
//           }
//         });
//       });
//     }
//   });

// Use the XMLHttpRequest API to read the contents of the file into a Blob object
// var xhr = new XMLHttpRequest();
// xhr.open("GET", "streetlight-locations.csv", true);
// xhr.responseType = "blob";
// xhr.onload = function () {
//   var blob = xhr.response;

//   // Create a FileReader object
//   var reader = new FileReader();

//   // Register an onload event handler that will be called when the file has been successfully read
//   reader.onload = function() {
//     var csvString = reader.result;

//     // Parse the CSV data using Papa Parse
//     Papa.parse(csvString, {
//       header: true,
//       error: function(error) {
//           console.error("There was an error while parsing the CSV file:", error);
//       },
//       complete: function(results) {
//           console.log("The CSV file was successfully parsed:", results);
//           const streetlights = results.data;
//           console.log(streetlights);
//           streetlights.forEach(light => {
//               const lat = light.Lat;
//               const long = light.Long;
//               // Add a layer to the map that displays the streetlights as circles
//               map.addLayer({
//                 id: "streetlights",
//                 type: "circle",
//                 source: {
//                   type: "geojson",
//                   data: {
//                     type: "FeatureCollection",
//                     features: [
//                       {
//                         type: "Feature",
//                         geometry: {
//                           type: "Point",
//                           coordinates: [long, lat]
//                         }
//                       }
//                     ]
//                   }
//                 },
//                 paint: {
//                   "circle-color": "#000000",
//                   "circle-radius": 50
//                 }
//               });
//           });
//       }
//     });
//   };

//   // Read the contents of the file into a string
//   reader.readAsText(blob);
// };
// xhr


// function download(dataurl, filename){
//   const link = document.createElement("a");
//   link.href = dataurl;
//   link.download = filename;
//   link.click();

//   const data = download("https://data.boston.gov/dataset/52b0fdad-4037-460c-9c92-290f5774ab2b/resource/c2fcc1e3-c38f-44ad-a0cf-e5ea2a6585b5/download/streetlight-locations.csv", "streetlight-locations.csv");
//   console.log(data);
// }

// reader.onload = function() {
//   const csvString = reader.result;

//   const latLongValues = extractLatLong(csvString);

//   console.log(latLongValues);
//   console.log(csvString);
// };

// reader.readAsText(file);
// console.log(reader);

// function extractLatLong(csvString) {

//   const lines = csvString.split('\n');

//   const columnNames = lines[0].split(',');

//   const latLongValues = [];

//   for (let i = 1; i < lines.length; i++) {

//     const values = lines[i].split(',');

//     const lat = values[columnNames.indexOf('Lat')];
//     const long = values[columnNames.indexOf('Long')];


//     latLongValues.push({ lat, long });
//   }

//   return latLongValues;
// }

// var data;

// Papa.parse('streetlight-locations.csv', {
//   header: true,
//   download: true,
//   dynamicTyping: true,
//   complete: function(results) {
//     console.log(results);
//     const streetlights = results.data;

//     streetlights.forEach(light => {
//       const lat = light.Lat;
//       const long = light.Long;
//       console.log(lat);
    
//      // Add a layer to the map that displays the streetlights as circles
//      map.addLayer({
//       id: "streetlights",
//       type: "circle",
//       source: {
//         type: "geojson",
//         data: {
//           type: "FeatureCollection",
//           features: [
//             {
//               type: "Feature",
//               geometry: {
//                 type: "Point",
//                 coordinates: [long, lat]
//               }
//             }
//           ]
//         }
//       },
//       paint: {
//         "circle-color": "#000000",
//         "circle-radius": 50
//       }
//     });
//   });
// } 
//   });





    
    
  