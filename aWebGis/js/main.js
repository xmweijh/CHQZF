var map, tb;
var dialog;
//dojo.registerModulePath('js',location.pathname.replace(/\/[^/]*$/, '') + '/js');
require([
    "esri/map", "esri/dijit/Search", "dojo/query", "esri/tasks/FindTask","esri/tasks/FindParameters","esri/geometry/Point",
    "esri/dijit/LocateButton","esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/FeatureLayer",
    "esri/InfoTemplate","esri/layers/GraphicsLayer","esri/dijit/Measurement", "esri/units",
    "dojo/dom", "esri/dijit/OverviewMap",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleMarkerSymbol","esri/symbols/PictureFillSymbol","esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol","esri/renderers/SimpleRenderer", "esri/graphic", "esri/lang",
    "esri/Color", "dojo/number", "dojo/dom-style",
    "dijit/TooltipDialog", "dijit/popup",
    "esri/toolbars/draw","esri/symbols/CartographicLineSymbol","dojo/on", "esri/dijit/HomeButton",
    "esri/dijit/Scalebar", "dojo/parser", "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"
    ], function(Map, Search,query,FindTask,FindParameters, Point,LocateButton,ArcGISTiledMapServiceLayer, FeatureLayer,InfoTemplate,GraphicsLayer,
                Measurement,Units,dom, OverviewMap,SimpleFillSymbol, SimpleMarkerSymbol, PictureFillSymbol,
                SimpleLineSymbol,PictureMarkerSymbol,SimpleRenderer, Graphic, esriLang,
                Color, number, domStyle,
                TooltipDialog, dijitPopup,Draw,CartographicLineSymbol,on,HomeButton,Scalebar, parser,
                ){
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
    var points = new FeatureLayer("http://localhost:6080/arcgis/rest/services/ft/FeatureServer/0",{
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


    var t = "<b>${house_addr}</b><hr><b>面积: </b>${house_rent}<br>"
        + "<b>房租: </b>${house_re_1}<br>"
        + "<b>布局: </b>${house_layo}、${house_floo}<br>"
        + "<b>朝向与模式: </b>${house_orie}、${house_re_2}<br>"
        + "<b>有无电梯、天然气: </b>${house_elev}、${house_gas}<br>"
        + "<b>有无停车场: </b>${house_park}<br>"
        + "<b>电、水模式: </b>${house_wate}、${house_elec}<br>"
        + "<b>标签: </b>${house_tag}<br>"
        + "<b><a href='https://cd.lianjia.com/zufang/${house_id}.html' target='_blank'>点击查看详细信息</a> </b>";

    var search = new Search({
        sources: [{
            featureLayer: new FeatureLayer("http://localhost:6080/arcgis/rest/services/ft/FeatureServer/0", {
                outFields: ["*"],
                infoTemplate: new InfoTemplate("信息",t)
            }),
            outFields: ["*"],
            displayField: "house_re_1",
            suggestionTemplate: "${house_addr}: ${house_rent}",
            name: "${house_addr}",
            zoomScale:50000,
            placeholder: "example: 1200 元/月",
            enableSuggestions: true,
            moreResults:true,
            maxSuggestions:100,
        }],
        map: map
    }, "search");
    search.startup();

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
                // tb.activate(tool);
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

    geoLocate = new LocateButton({
        map: map
    }, "LocateButton");
    geoLocate.startup();

    var scalebar = new Scalebar({
        map: map,
        attachTo:"top-right",
        scalebarUnit: "dual"
    });


    var nameArr=[];//用于存储查询地点名称
    var shapeArr=[];//用于存储查询shape
    var areaArr=[];//用于存储面积
    var graphicsLayer1 = new GraphicsLayer();
    map.addLayer(graphicsLayer1);
    on(dom.byId("btnF"), "click", function() {
        var name=dom.byId("searchInput").value;//获得输入框的值
        graphicsLayer1.clear();//清空graphics
        //实例化查询参数
        var findParams = new FindParameters();
        findParams.returnGeometry = true;
        findParams.layerIds = [0];
        findParams.contains = true;//是否接受模糊查找
        findParams.searchFields = ["house_re_1","house_addr","house_rent","house_layo"];
        findParams.searchText = name;
        //实例化查询对象
        var findTask = new FindTask("http://localhost:6080/arcgis/rest/services/ft/MapServer");
        //进行查询
        findTask.execute(findParams,showFindResult)
    });
    on(dom.byId("del"), "click", function(evt) {
        graphicsLayer1.clear();
    });
    function showFindResult(queryResult)
    {
        //初始化信息暂存数组
        nameArr=[];
        shapeArr=[];
        areaArr=[];
        if (queryResult.length === 0) {
            alert("查询无结果");
            return;
        }
        for (var i = 0; i < queryResult.length; i++) {
            nameArr[i]=queryResult[i].feature.attributes.house_re_1;
            shapeArr[i]=queryResult[i].feature.attributes.house_addr;
            areaArr[i]=queryResult[i].feature.attributes.house_rent;
            //定义高亮图形的符号

            var pointSymbol = new SimpleMarkerSymbol(//定义点符号
                SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,0,0]), 1),
                new Color([255,0,0]));
            var outline= new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,new Color([255, 0, 0]), 1); //定义面的边界线符号
            var PolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, outline,new Color([0, 255, 0, 1])); //定义面符号

            var graphic ={}; //创建graphic
            var locationPoint ={};//创建定位点
            var geometry = queryResult[i].feature.geometry;//获得该图形的形状
            if(geometry.type ==="polygon"){
                graphic = new Graphic(geometry, PolygonSymbol);
                locationPoint=geometry.getCentroid();
            }
            else if(geometry.type ==="point"){
                graphic = new Graphic(geometry, pointSymbol);
                locationPoint=geometry;
            }
            //将图形添加到map中
            graphicsLayer1.add(graphic);
            map.centerAndZoom(locationPoint,13);
        }
        var html="";
        for(var i=0;i<nameArr.length;i++){
            html+="<tr>" +
                " <td >"+nameArr[i]+"</td>" +
                "<td >"+shapeArr[i]+"</td>" +
                "<td >"+areaArr[i]+"</td>"+
                "</tr>";
        }
        dom.byId("infoBody").innerHTML =html;
    }

    var measurement = new Measurement({
        map: map,
        defaultAreaUnit: Units.SQUARE_KILOMETERS,
        defaultLengthUnit: Units.KILOMETERS
    }, dom.byId("measurementDiv"));
    measurement.startup();

    on(dom.byId("Mea"), "click", function() {
        dom.byId("measurementDiv").style.display = dom.byId("measurementDiv").style.display == "block"?"none":"block";
    });
});