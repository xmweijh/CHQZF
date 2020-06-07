var map, tb;
var dialog;
//dojo.registerModulePath('js',location.pathname.replace(/\/[^/]*$/, '') + '/js');
require([
    "esri/map", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/FeatureLayer","esri/layers/GraphicsLayer",
    "dojo/dom", "esri/dijit/OverviewMap",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleMarkerSymbol","esri/symbols/PictureFillSymbol","esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol","esri/renderers/SimpleRenderer", "esri/graphic", "esri/lang",
    "esri/Color", "dojo/number", "dojo/dom-style",
    "dijit/TooltipDialog", "dijit/popup",
    "esri/toolbars/draw","esri/symbols/CartographicLineSymbol","dojo/on", "esri/dijit/HomeButton",
    "dojo/domReady!"
    ], function(Map, ArcGISTiledMapServiceLayer, FeatureLayer,GraphicsLayer,dom, OverviewMap,SimpleFillSymbol, SimpleMarkerSymbol, PictureFillSymbol,
                SimpleLineSymbol,PictureMarkerSymbol,SimpleRenderer, Graphic, esriLang,
                Color, number, domStyle,
                TooltipDialog, dijitPopup,Draw,CartographicLineSymbol,on,HomeButton
                ){

    map = new Map("mapDiv",{
    logo:false,
    center:[104.15313720703125,30.682777594542781],
    zoom:13,
        //basemap:"osm"
    });
    //var layer=new ArcGISDynamicMapServiceLayer("http://localhost:6080/arcgis/rest/services/chenhuamap/MapServer");
    //将地图服务对象添加到地图容器中
    //map.addLayer(layer);
    var basemap = new ArcGISTiledMapServiceLayer("http://cache1.arcgisonline.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer");
    map.addLayer(basemap);
    var points = new FeatureLayer("http://localhost:6080/arcgis/rest/services/MyMapService/FeatureServer/0",{
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["house_addr","house_rent","house_orie","house_layo", "house_floo","house_re_1","house_re_2","house_id",
            "house_tag", "house_elev","house_park","house_wate","house_elec","house_gas"]
    });
    //var selectionSymbol = new PictureMarkerSymbol("images/locate.png", 48 ,48);
    map.addLayer(points);
    //points.setSelectionSymbol(selectionSymbol);
    var overviewMapDijit = new OverviewMap({
        //指定将小部件绑定在地图的哪一个位置：可以填写top-right,bottom-right,bottom-left 和top-left.
        attachTo: "bottom-left",
        map: map,
        visible: true,
    });
    //2.启用小部件
    overviewMapDijit.startup();

    map.infoWindow.resize(245,125);

    dialog = new TooltipDialog({
        id: "tooltipDialog",
        style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
    });
    dialog.startup();
    var lineSymbol=new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([152, 245, 255]), 3);
    //定义点符号l
    var highlightSymbol=new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,10, lineSymbol, new Color([152, 245, 255]));
    //close the dialog when the mouse leaves the highlight graphic
    map.on("load", function(){
        map.graphics.enableMouseEvents();
        map.graphics.on("mouse-out", closeDialog);

    });

    //listen for when the onMouseOver event fires on the countiesGraphicsLayer
    //when fired, create a new graphic with the geometry from the event.graphic and add it to the maps graphics layer
    points.on("mouse-over", function(evt){
        var t = "<b>${house_addr}</b><hr><b>面积: </b>${house_rent}<br>"
            + "<b>房租: </b>${house_re_1}<br>"
            + "<b>布局: </b>${house_layo}、${house_floo}<br>"
            + "<b>朝向与模式: </b>${house_orie}、${house_re_2}<br>"
            + "<b>有无电梯、天然气: </b>${house_elev}、${house_gas}<br>"
            + "<b>有无停车场: </b>${house_park}<br>"
            + "<b>电、水模式: </b>${house_wate}、${house_elec}<br>"
            + "<b>标签: </b>${house_tag}<br>"
            + "<b><a href='https://cd.lianjia.com/zufang/${house_id}.html' target='_blank'>点击查看详细信息</a> </b>";

        var content = esriLang.substitute(evt.graphic.attributes,t);
        var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
        map.graphics.add(highlightGraphic);

        dialog.setContent(content);

        domStyle.set(dialog.domNode, "opacity", 0.85);
        dijitPopup.open({
            popup: dialog,
            x: evt.pageX,
            y: evt.pageY
        });
    });

    function closeDialog() {
        map.graphics.clear();
        dijitPopup.close(dialog);
    }


    var graphicsLayer = new GraphicsLayer();
    map.addLayer(graphicsLayer);
    map.on("load", initToolbar);

    // markerSymbol is used for point and multipoint, see http://raphaeljs.com/icons/#talkq for more examples
    var markerSymbol = new SimpleMarkerSymbol();
    markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
    markerSymbol.setColor(new Color("#00FFFF"));

    // lineSymbol used for freehand polyline, polyline and line.
    var lineSymbol = new CartographicLineSymbol(
        CartographicLineSymbol.STYLE_SOLID,
        new Color([255,0,0]), 10,
        CartographicLineSymbol.CAP_ROUND,
        CartographicLineSymbol.JOIN_MITER, 5
    );

    // fill symbol used for extent, polygon and freehand polygon, use a picture fill symbol
    // the images folder contains additional fill images, other options: sand.png, swamp.png or stiple.png
    var fillSymbol = new PictureFillSymbol(
        "images/done.png",
        new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color('#000'),
            1
        ),
        42,
        42
    );

    function initToolbar() {
        tb = new Draw(map);
        tb.on("draw-end", addGraphic);

        // event delegation so a click handler is not
        // needed for each individual button
        on(dom.byId("info"), "click", function(evt) {
            if ( evt.target.id === "info" ) {
                return;
            } else if (evt.target.id ==="Delete"){
                graphicsLayer.clear();
                tb.activate(tool);
                return;
            }
            var tool = evt.target.id.toLowerCase();
            map.disableMapNavigation();
            tb.activate(tool);
        });
    }

    function addGraphic(evt) {
        //deactivate the toolbar and clear existing graphics
        tb.deactivate();
        map.enableMapNavigation();

        // figure out which symbol to use
        var symbol;
        if ( evt.geometry.type === "point" || evt.geometry.type === "multipoint") {
            symbol = markerSymbol;
        } else if ( evt.geometry.type === "line" || evt.geometry.type === "polyline") {
            symbol = lineSymbol;
        }
        else {
            symbol = fillSymbol;
        }
        graphicsLayer.add(new Graphic(evt.geometry, symbol));
        // map.graphics.add(new Graphic(evt.geometry, symbol));
    }

    var home = new HomeButton({
        map: map
    }, "HomeButton");
    home.startup();

});