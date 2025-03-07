const POPUP_X_OFFSET = -100;
const POPUP_Y_OFFSET = -75;

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

    add(/**@type {Array} */ floors, selected, map, path) {
        console.log("Loading floor " + selected);
        // Resetto eventuali contenuti precedenti
        this.innerHTML = "";
        ClearPolys(map);
        LoadPolys(map, selected.id);

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
        if (layer._path != undefined) {
            console.log(layer);
            map.removeLayer(layer);
        }
    });
}

function LoadPolys(map, floor) {
    // Oggetto auth per caricare gli asset dal server
    var auth = new ZAMAuth();;

    var popup = document.getElementById("zam-asset-popup");

    auth.getFloorAssets(floor, (assets) => {
        // Dati dal server
        for(var asset of assets) {
            var coords = JSON.parse(asset.coords);
            auth.getBookingsByAsset(asset.id, (bookings) => {
                if(bookings.length > 0) {
                    for(var booking of bookings) {
                        var body = booking.body;

                        var start = new Date(body.inizio).valueOf();
                        var end = new Date(body.fine).valueOf();
                        var now = new Date().getTime();

                        console.log({start, end, now});

                        if(start <= now && end >= now) {
                            console.log("in uso!");
                        }
                    }
                }
            });

            // Poligono invisibile
            var polygon = L.polygon(coords, {
                opacity: 0.0,
                fillOpacity: 0.0,
                name: asset.nome
            });
        
            polygon.on('mouseover', (e) => {
                popup.setAttribute("active", "");
                popup.innerText = e.target.options["name"];

                //var startX = e.containerPoint.x;
                //var startY = e.containerPoint.y;

                //var endX = e.target._pxBounds.max.x;
                //var endY = e.target._pxBounds.max.y;

                //var targetWidth = (endX - startX);
                //var targetHeight = (endY - startY);
                
                //var targetX = startX + POPUP_X_OFFSET;
                //var targetY = startY + POPUP_Y_OFFSET;

                //popup.style.top = targetY + "px";
                //popup.style.left = targetX + "px";
                
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
            
            polygon.addTo(map);
        }
    });
}

class ZAMMap {
    constructor(/**@type {ZAMMapType} */type, path, /**@type {HTMLElement} */ container) {
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

        var fab = document.createElement("zam-map-fab");
        fab.add(Object.values(ZAMMapType), type, this.map, path);
    }
}

customElements.define("zam-map-fab", ZAMMapFAB);
customElements.define("zam-asset-popup", ZAMAssetPopup);