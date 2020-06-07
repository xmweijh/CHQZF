var map;
var dialog,toolbar, symbol, geomTask;;
//dojo.registerModulePath('js',location.pathname.replace(/\/[^/]*$/, '') + '/js');
require([
    "esri/map", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/FeatureLayer",
    "dojo/dom", "esri/dijit/OverviewMap",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleMarkerSymbol","esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol","esri/renderers/SimpleRenderer", "esri/graphic", "esri/lang",
    "esri/Color", "dojo/number", "dojo/dom-style",
    "dijit/TooltipDialog", "dijit/popup",
    "esri/toolbars/draw",
    "dojo/parser", "dijit/registry",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dijit/form/Button", "dijit/WidgetSet",
    "dojo/domReady!"
    ], function(Map, ArcGISTiledMapServiceLayer, FeatureLayer,dom, OverviewMap,SimpleFillSymbol, SimpleMarkerSymbol,
                SimpleLineSymbol,PictureMarkerSymbol,SimpleRenderer, Graphic, esriLang,
                Color, number, domStyle,
                TooltipDialog, dijitPopup,Draw,
                parser, registry){
    parser.parse();

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


    map.on("load", createToolbar);
    // loop through all dijits, connect onClick event
    // listeners for buttons to activate drawing tools
    registry.forEach(function(d) {
        // d is a reference to a dijit
        // could be a layout container or a button
        if ( d.declaredClass === "dijit.form.Button" ) {
            d.on("click", activateTool);
        }
    });

    function activateTool() {
        var tool = this.label.toUpperCase().replace(/ /g, "_");
        toolbar.activate(Draw[tool]);
        map.hideZoomSlider();
    }

    function createToolbar(themap) {
        toolbar = new Draw(map);
        toolbar.on("draw-end", addToMap);
    }

    function addToMap(evt) {
        var symbol;
        toolbar.deactivate();
        map.showZoomSlider();
        switch (evt.geometry.type) {
            case "point":
            case "multipoint":
                symbol = new SimpleMarkerSymbol();
                break;
            case "polyline":
                symbol = new SimpleLineSymbol();
                break;
            default:
                symbol = new SimpleFillSymbol();
                break;
        }
        var graphic = new Graphic(evt.geometry, symbol);
        map.graphics.add(graphic);
    }
});