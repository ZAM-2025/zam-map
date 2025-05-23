const POPUP_X_OFFSET = -100;
const POPUP_Y_OFFSET = -75;

let markerIcon = L.icon({
    iconUrl: "svg/marker.svg",
    iconSize: [42, 42]
});

let ZAMMapType = {
    Floor: {
        path: "floor-1",
        label: "1",
        id: 2
    },
    Ground: {
        path: "floor-t",  
        label: "T",
        id: 1
    },
    Parking: {
        path: "floor-p",
        label: "P",
        id: 0
    }
}

class ZAMAssetPopup extends HTMLElement {
    constructor() {
        super();
    }
}

class ZAMMapFAB extends HTMLElement {
    constructor() {
        super();
    }

    fillButtons(/**@type {Array} */ floors, selected, map, path) {
        floors.forEach((floor) => {
            // Creo un tasto per il piano
            var floorButton = document.createElement("div");
            floorButton.className = "floor-button";
            floorButton.innerText = floor.label;

            // Evidenzio il tasto selezionato
            if(floor.path == selected.path) {
                floorButton.setAttribute("selected", "");
            }

            this.appendChild(floorButton);

            // Quando clicco un piano:
            floorButton.onclick = () => {
                if(floor == selected) {
                    // Se seleziono il piano attuale,
                    // chiudo il FAB e non faccio niente
                    this.removeAttribute("open");
                    return;
                }

                // Rimuovo la mappa esistente
                // TODO: Togliere anche eventuali marker/poligoni
                map.eachLayer(function(layer) {
                    if (layer instanceof L.TileLayer) {
                        map.removeLayer(layer);
                    }
                });

                // Carico un layer nuovo
                L.tileLayer(path + floor.path + "/{z}/{x}/{y}.png", {
                    maxZoom: 4,
                    minZoom: 2,
                    noWrap: true,
                }).addTo(map);

                // Chiudo il FAB
                this.removeAttribute("open");
                this.add(floors, floor, map, path);
            };
        });
    }

    add(/**@type {Array} */ floors, selected, map, path, isDummy) {
        console.log("Loading floor " + selected.label);
        // Resetto eventuali contenuti precedenti
        this.innerHTML = "";
        ClearPolys(map);
        LoadPolys(map, selected.id, isDummy);

        var img = document.createElement("img");
        img.className = "fab-img";
        img.src = "svg/floor.svg";
        this.appendChild(img);
        
        img.onclick = (e) => {
            if(this.getAttribute("open") === null) {
                this.setAttribute("open", "");
            } else {
                this.removeAttribute("open");
            }
        };

        this.fillButtons(floors, selected, map, path);
        document.body.appendChild(this);
    }
}

function ClearPolys(map) {
    map.eachLayer(function(layer) {
        if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Rectangle || layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

function LoadPolys(map, floor, isDummy) {
    // Oggetto auth per caricare gli asset dal server
    var auth = new ZAMAuth();

    var popup = document.getElementById("zam-asset-popup");

    if(isDummy != undefined && isDummy != null && isDummy == true) {
        console.log("dummy 2");

        var points = [];

        map.on("click", (e) => {
            console.log(e);
            ClearPolys(map);

            points.push(e.latlng);

            var polygon = L.polygon(points);
            polygon.addTo(map);
        });

        map.on("mousedown", (e) => {
            if (e.originalEvent.button === 1) {
                console.log(e.latlng);
                L.marker(e.latlng).addTo(map);
                points.push(e.latlng);

                var sql = "INSERT INTO asset (id, stato, tipo, coords, nome, piano, attivo, ismarker) ";

                let nome = prompt("Nome?");
                let tipo = prompt("Tipo?");

                sql += `VALUES (DEFAULT, 'LIBERO', '${tipo}', '${JSON.stringify([e.latlng])}', '${nome}', ${floor}, true, true)`;
                console.log(sql);
            }
        });

        map.on("contextmenu", (e) => {
            alert(JSON.stringify(points));
            points = [];
            ClearPolys(map);
        })
        return;
    }

    auth.getUserInfo((userInfo) => {
        auth.getFloorAssets(floor, (assets) => {
            // Dati dal server
            for(var asset of assets) {
                var coords = JSON.parse(asset.coords);
                console.log(coords);
    
                // Poligono invisibile
                var opacity = (asset.active) ? 0.0 : 0.2;
                var polygon;

                if(asset.isMarker) {
                    var polygon = L.marker(coords[0], {
                        name: asset.nome,
                        id: asset.id,
                        active: asset.active,
                        data: asset,
                        icon: markerIcon
                    });
                } else {
                    var polygon = L.polygon(coords, {
                        opacity: opacity,
                        fillOpacity: opacity,
                        name: asset.nome,
                        id: asset.id,
                        active: asset.active,
                        data: asset,
                        color: 'red'
                    });
                } 
            
                polygon.on('mouseover', (e) => {
                    popup.setAttribute("active", "");
    
                    popup.innerHTML = "";
    
                    auth.getBookingsByAsset(e.target.options["id"], (bookings) => {
                        var indicator = document.createElement("p");
                        indicator.className = "indicatore";
    
                        var isFree = true;
    
                        if(bookings.length > 0) {
                            for(var booking of bookings) {
                                if(booking.isBooked) {
                                    isFree = false;
                                    break;
                                }
                            }
                        }
    
                        if (e.target.options["active"] == false) {
                            indicator.setAttribute("nd", "");
                            indicator.innerText = "Non disponibile";
                        } else if(isFree) {
                            indicator.setAttribute("libero", "");
                            indicator.innerText = "Libero";
                        } else {
                            indicator.setAttribute("occupato", "");
                            indicator.innerText = "Occupato";
                        }
    
                        popup.innerHTML = "";
                        var popupName = document.createElement("p");
                        popupName.setAttribute("bold", "");
                        popupName.innerText = e.target.options["name"];
    
                        popup.appendChild(popupName);
                        popup.appendChild(indicator);
                    });
                    
                    e.target.on('mousemove', (me) => {
                        popup.style.top = me.originalEvent.clientY + POPUP_Y_OFFSET + "px";
                        popup.style.left = me.originalEvent.clientX + POPUP_X_OFFSET + "px";
                    });
                });
    
                polygon.on('mouseout', () => {
                    popup.removeAttribute("active");
                    // Quando il popup è [active], è impostato display: none
                    // Ma per sicurezza lo togliamo di vista comunque
                    popup.style.top = "-100px";
                    popup.style.left = "-100px";
    
                    polygon.off('mousemove');
                });
    
                polygon.on('click', (e) => {
                    var bars = document.getElementsByTagName("zam-booking-sidebar");
                    for(var elem of bars) {
                        elem.remove();
                    }
                    
                    console.log(e);
                    var name = e.target.options["name"];
                    var id = e.target.options["id"];
                    console.log(e.target.options);
        
                    auth.getBookingsByAsset(e.target.options.id, (bookings) => {
                        var isFree = true;
                                
                        var start = null;
                        var end = null;
                        
                        if(bookings.length > 0) {
                            for(var booking of bookings) {
                                if(booking.isBooked) {
                                    var startDate = new Date(booking.body.inizio);
                                    var endDate = new Date(booking.body.fine);
        
                                    start = String(startDate.getHours()).padStart(2, '0') + ":" + String(startDate.getMinutes()).padStart(2, '0');
                                    end = String(endDate.getHours()).padStart(2, '0') + ":" + String(endDate.getMinutes()).padStart(2, '0');

                                    isFree = false;
                                    break;
                                }
                            }
                        }
        
                        var bookBar = new BookingSidebar();
                        bookBar.add(name, start, end, isFree, id, false, false, e.target.options["active"]);
                    });
                });
                
                polygon.addTo(map);
            }
        });      
    });
}

class ZAMMap {
    constructor(/**@type {ZAMMapType} */type, path, /**@type {HTMLElement} */ container, isDummy) {
        this.mapElem = document.createElement("div");
        this.mapElem.id = "zam-map";

        if(container != null) {
            container.appendChild(this.mapElem);
        } else {
            document.body.appendChild(this.mapElem);
        }

        this.map = L.map("zam-map", {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 1);
        this.map.setMaxBounds(this.map.getBounds());

        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        if(path == null) {
        	path = "";
        }

        L.tileLayer(path + type.path + "/{z}/{x}/{y}.png", {
            maxZoom: 4,
            minZoom: 2,
            noWrap: true,
        }).addTo(this.map);

        var popup = document.createElement("zam-asset-popup");
        popup.id = "zam-asset-popup";
        document.body.appendChild(popup);

        if(isDummy != undefined && isDummy != null && isDummy == true) {
            console.log("dummy");
            this.isDummy = true;
        } else {
            this.isDummy = false;
        }

        var fab = document.createElement("zam-map-fab");
        fab.add(Object.values(ZAMMapType), type, this.map, path, this.isDummy);
    }
}

customElements.define("zam-map-fab", ZAMMapFAB);
customElements.define("zam-asset-popup", ZAMAssetPopup);