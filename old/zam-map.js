const ZAMMapFloor = {
    Floor1: "floor-01"
};

function _zamclamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
};

class ZAMMarker {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;

        this.element = document.createElement("div");
        this.element.id = "zam-marker-" + id;
        this.element.className = "zam-map-marker";

        this.element.style.top = y + "px";
        this.element.style.left = x + "px";

        this.element.style.scale = "100%";
    }

    getElement() {
        return this.element;
    }

    render(offsetX, offsetY) {
        var currentX = parseFloat(this.element.style.left, 10);
        var currentY = parseFloat(this.element.style.top, 10);

        this.element.style.top = currentY + offsetY + "px";
        this.element.style.left = currentX + offsetX + "px";
    }

    zoom(e, minz, maxz) {
        var currentZoom = parseFloat(this.element.style.scale, 10);
        var newZoom = _zamclamp(currentZoom + e.deltaY, minz, maxz);

        var zoomFactor = newZoom / currentZoom;

        var rect = this.element.getBoundingClientRect();
        
        var mouseX = e.clientX - rect.left; // Mouse X relative to element
        var mouseY = e.clientY - rect.top;  // Mouse Y relative to element
        
        var currentX = parseFloat(this.element.style.left, 10);
        var currentY = parseFloat(this.element.style.top, 10);
        
        var offsetX = (mouseX - currentX) * (zoomFactor - 1);
        var offsetY = (mouseY - currentY) * (zoomFactor - 1);
        
        this.element.style.left = (currentX - offsetX) + "px";
        this.element.style.top = (currentY - offsetY) + "px";
        
        this.element.style.scale = newZoom + "%";

        console.log(newZoom);
    }
}

class ZAMMap {
    constructor(/** @type {ZAMMapFloor} */ type, w, h, minz, maxz) {
        this.map = document.createElement("div");
        this.map.className = "zam-map";

        this.map.style.backgroundImage = "url(assets/" + type + ".svg)";

        this.map.style.backgroundPositionX = "0px";
        this.map.style.backgroundPositionY = "0px";

        this.map.style.width = w + "px";
        this.map.style.height = h + "px";

        this.map.style.backgroundSize = minz + "%";

        document.body.appendChild(this.map);

        this.mouseDown = false;

        this.markers = [];

        this.map.ondragstart = () => {
            return false;
        }

        this.map.onmousedown = () => {
            this.mouseDown = true;
        };

        this.map.onmouseup = () => {
            this.mouseDown = false;
        };

        this.map.onmousemove = (e) => {
            if (this.mouseDown) {
                var currentX = parseFloat(this.map.style.backgroundPositionX, 10);
                var currentY = parseFloat(this.map.style.backgroundPositionY, 10);

                this.map.style.backgroundPositionY = currentY + e.movementY + "px";
                this.map.style.backgroundPositionX = currentX + e.movementX + "px";

                this.markers.forEach((/** @type {ZAMMarker} */ marker) => {
                    marker.render(e.movementX, e.movementY);
                });
            }
        };

        this.map.onwheel = (e) => {
            e.preventDefault();

            var currentZoom = parseFloat(this.map.style.backgroundSize, 10);
            var newZoom = _zamclamp(currentZoom + e.deltaY, minz, maxz);

            var zoomFactor = newZoom / currentZoom;

            this.markers.forEach((/** @type {ZAMMarker} */ marker) => {
                //marker.zoom(e, minz, maxz);
            });

            var rect = this.map.getBoundingClientRect();
            var mouseX = e.clientX - rect.left; // Mouse X relative to map
            var mouseY = e.clientY - rect.top;  // Mouse Y relative to map

            var currentX = parseFloat(this.map.style.backgroundPositionX, 10);
            var currentY = parseFloat(this.map.style.backgroundPositionY, 10);

            var offsetX = (mouseX - currentX) * (zoomFactor - 1);
            var offsetY = (mouseY - currentY) * (zoomFactor - 1);
            
            this.map.style.backgroundPositionX = (currentX - offsetX) + "px";
            this.map.style.backgroundPositionY = (currentY - offsetY) + "px";

            this.map.style.backgroundSize = newZoom + "%";
        };
    }

    addMarker(/** @type {ZAMMarker} */ marker) {
        this.markers.push(marker);
        this.map.appendChild(marker.getElement());
    }
}