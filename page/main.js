const parameterData = [
    {"name": "PM10", "value": "pm10", "unit":"µg/m³", "range": "0,605"},
    {"name": "PM2.5", "value": "pm25", "unit":"µg/m³", "range": "0,501"},
    {"name": "O₃ mass", "value": "o3", "unit":"µg/m³", "range": "0,1183.84"},
    {"name": "CO mass", "value": "co", "unit":"µg/m³", "range": "0,58675.7"},
    {"name": "NO₂ mass", "value": "no2", "unit":"µg/m³", "range": "0,3852"},
    {"name": "SO₂ mass", "value": "so2", "unit":"µg/m³", "range": "0,2630.5"},
    {"name": "NO₂", "value": "no2", "unit":"ppm", "range": "0,2.05"},
    {"name": "CO", "value": "co", "unit":"ppm", "range": "0,400"},
    {"name": "SO₂", "value": "so2", "unit":"ppm", "range": "0,2.631"},
    {"name": "O₃", "value": "o3", "unit":"ppm", "range": "0,0.604"},
    {"name": "BC", "value": "bc", "unit":"µg/m³", "range": "0,501"},
    {"name": "NO₂", "value": "no2", "unit":"ppb", "range": ""},
    {"name": "PM1", "value": "pm1", "unit":"µg/m³", "range": "0,501"},
    {"name": "CO₂", "value": "co2", "unit":"ppm", "range": "0,5000"},
    {"name": "NO", "value": "no", "unit":"ppb", "range": ""},
    {"name": "NOx mass", "value": "nox", "unit":"µg/m³", "range": "0,6150"},
    {"name": "NO", "value": "no", "unit":"ppm", "range": "0,2.631"},
    {"name": "PM0.3 count", "value": "um003", "unit":"particles/cm³", "range": ""},
    {"name": "PM1 count", "value": "um010", "unit":"particles/cm³", "range": "0,501"},
    {"name": "PM5.0 count", "value": "um050", "unit":"particles/cm³", "range": ""},
    {"name": "PM2.5 count", "value": "um025", "unit":"particles/cm³", "range": "0,2.631"},
    {"name": "PM0.5", "value": "um005", "unit":"particles/cm³", "range": ""},
    {"name": "PM10 count", "value": "um100", "unit":"particles/cm³", "range": "0,2.631"},
    {"name": "VOC", "value": "voc", "unit":"iaq", "range": ""},
    {"name": "O₃", "value": "ozone", "unit":"ppb", "range": ""},
    {"name": "NOx", "value": "nox", "unit":"ppm", "range": "0,5"},
    {"name": "NO mass", "value": "no", "unit":"µg/m³", "range": "0,50.5"},
    {"name": "PM4.0", "value": "pm4", "unit":"µg/m³", "range": "0,501"}
    ];

    let map;
    let markers = [];
    let markerCluster;
    let geocoder;
    let infoWindow;

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 0, lng: 0 },
            zoom: 4
        });
        google.maps.event.addListener(map, 'click', function() {
            infoWindow.close();
        });

        infoWindow = new google.maps.InfoWindow();
        geocoder = new google.maps.Geocoder();

        markerCluster = new MarkerClusterer(map, markers, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            maxZoom: 8
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
            }, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            });
        } else {
            handleLocationError(false, infoWindow, map.getCenter());
        }

        populateParameterSelect();
        fetchDataAndDisplay();
    }

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);
    }

    function populateParameterSelect() {
        const selectBox = document.getElementById('parameterSelect');
        parameterData.forEach(param => {
            const option = document.createElement('option');
            option.value = param.value;
            option.textContent = `${param.name} (${param.unit})`;
            selectBox.appendChild(option);
        });
    }

    function clearMarkers() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }

    var currentPage = 1;
    const LIMIT = 1000;

    function fetchDataAndDisplay() {
        clearMarkers();
        currentPage = 1;
        const selectedParameter = document.getElementById('parameterSelect').value;
        const selectedData = parameterData.find(p => p.value === selectedParameter);
        const range = selectedData.range ? selectedData.range.split(',').map(Number) : null;
        
        document.getElementById('indicatorText').textContent = `${selectedData.name} (${selectedData.unit})`;
        document.getElementById('minValue').textContent = range ? range[0] : 0;
        document.getElementById('maxValue').textContent = range ? `${range[1]}+` : '500+';

        fetchDataByPage(selectedParameter, currentPage, range);
        
    }
    function fetchTimeSeriesData(location) {
        document.getElementById("timeSeriesChart").innerHTML = 'Loading...';
        const parameter = document.getElementById('parameterSelect').value;
        const apiUrl = `/v1/measurements?limit=100&page=1&offset=0&sort=desc&parameter=${parameter}&location=${location}&order_by=datetime`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                document.getElementById("timeSeriesChart").innerHTML = '';
                drawTimeSeriesChart(data.results);
            }).catch(() => {
                document.getElementById("timeSeriesChart").innerHTML = `<span>Failed to retrieve data. <button onclick="fetchTimeSeriesData('`+location+`')">Reload</button></span>`;
            });
    }
    function drawTimeSeriesChart(data) {
        const svg = d3.select("#timeSeriesChart").append("svg")
            .attr("width", 500)
            .attr("height", 300);

        const margin = {top: 20, right: 20, bottom: 30, left: 50};
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const x = d3.scaleTime().rangeRound([0, width]);
        const y = d3.scaleLinear().rangeRound([height, 0]);

        const g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(data, d => new Date(d.date.utc)));
        y.domain(d3.extent(data, d => d.value));

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .select(".domain")
            .remove();

        g.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Value (µg/m³)");

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(new Date(d.date.utc)))
                .y(d => y(d.value)));
    }
    function createDotWithOpacity(opacity) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 20;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = function() {
                ctx.globalAlpha = opacity;
                ctx.drawImage(img, 0, 0, 20, 20);
                resolve(canvas.toDataURL());
            };
            img.onerror = function() {
                reject(new Error("Failed to load image"));
            };
            img.src = '/dot.png';
        });
    }

    function fetchDataByPage(parameter, page, range) {
        const apiUrl = `/v1/latest?limit=${LIMIT}&page=${page}&parameter=${parameter === "" ? "pm10" : parameter}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const measurements = data.results;
                measurements.forEach(measurement => {
                    let m = null;
                    for (let i = 0;i < measurement.measurements.length; i++) {
                        if (measurement.measurements[i].parameter == parameter) {
                            m = measurement.measurements[i];
                        }
                    }
                    let opacity = 1;
                    if (range) {
                        const value = m.value;
                        const normalizedValue = (value - range[0]) / (range[1] - range[0]);
                        const level = Math.round(normalizedValue * 4);
                        opacity = 0.2 + (0.8 * level / 4);
                    }
                    const color = `rgba(34, 18, 68, ${opacity})`;

                    const position = {
                        lat: measurement.coordinates.latitude,
                        lng: measurement.coordinates.longitude
                    };
                    createDotWithOpacity(opacity).then(dataUrl => {
                        const marker = new google.maps.Marker({
                            position: position,
                            map: map,
                            icon: {
                                url: dataUrl,
                                scaledSize: new google.maps.Size(20, 20),
                            },
                            optimized: true
                        });
                        const infoContent = `
                        <div style="display: flex; flex-wrap: wrap; line-height:20px">
                            <div style="flex: 1 50%;"><strong>City:</strong> ${measurement.city}</div>
                            <div style="flex: 1 50%;"><strong>Location:</strong> ${measurement.location}</div>
                            <div style="flex: 1 50%;"><strong>Value:</strong> ${m.value} ${m.unit}</div>
                            <div style="flex: 1 50%;"><strong>Last Updated:</strong> ${new Date(m.lastUpdated).toLocaleString()}</div>
                        </div>
                        <div id="timeSeriesChart" style="width: 500px; height: 320px;text-align:center;display: flex;align-items: center;justify-content: center;"></div>
                        `;
                        marker.addListener('click', function() {
                            infoWindow.setContent(infoContent);
                            infoWindow.open(map, marker);
                            setTimeout(() => fetchTimeSeriesData(measurement.location), 1);
                        });
                        markers.push(marker);
                        markerCluster.clearMarkers();
                        markerCluster.addMarkers(markers);
                    }).catch(error => {
                        console.error("Error creating dot with opacity:", error);
                    });

                });
                

                if (data.meta.found > LIMIT * page) {
                    currentPage++;
                    fetchDataByPage(parameter, currentPage, range);
                } else {
                    currentPage = 1;
                }
            });
    }