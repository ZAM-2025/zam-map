let ZAMMapType = {
    Floor: "floor-1",
    Ground: "floor-g",
    Parking: "floor-p"
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

        L.tileLayer(path + type + "/{z}/{x}/{y}.png", {
            maxZoom: 4,
            minZoom: 2,
            noWrap: true,
        }).addTo(this.map);
    }
}
