let ZAMMapType = {
    Floor: {
        path: "floor-1",
        label: "1"
    },
    Ground: {
        path: "floor-t",  
        label: "T"
    },
    Parking: {
        path: "floor-p",
        label: "P"
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
        // Resetto eventuali contenuti precedenti
        this.innerHTML = "";

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

        var fab = document.createElement("zam-map-fab");
        fab.add(Object.values(ZAMMapType), type, this.map, path);
    }
}

customElements.define("zam-map-fab", ZAMMapFAB);