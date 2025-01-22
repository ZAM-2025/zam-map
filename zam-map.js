const ZAMMapType = {
    Floor1: "floor-01"
};

class ZAMMap {
    constructor(/** @type {ZAMMapType} */ type, w, h, minz, maxz) {
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

        var clamp = (v, min, max) => {
            return Math.min(Math.max(v, min), max);
        };

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
            }
        };

        this.map.onwheel = (e) => {
            e.preventDefault();

            var currentZoom = parseFloat(this.map.style.backgroundSize, 10);
            var newZoom = clamp(currentZoom + e.deltaY, minz, maxz);

            var zoomFactor = newZoom / currentZoom;

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
}