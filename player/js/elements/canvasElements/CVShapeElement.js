function CVShapeElement(data, comp,globalData){
    this.shapes = [];
    this.stylesList = [];
    this.viewData = [];
    this.shapesData = data.shapes;
    this.firstFrame = true;
    this.parent.constructor.call(this,data, comp,globalData);
}
createElement(CVBaseElement, CVShapeElement);

CVShapeElement.prototype.lcEnum = {
    '1': 'butt',
    '2': 'round',
    '3': 'butt'
}

CVShapeElement.prototype.ljEnum = {
    '1': 'butt',
    '2': 'round',
    '3': 'butt'
}

CVShapeElement.prototype.dashResetter = [];

CVShapeElement.prototype.createElements = function(){

    this.parent.createElements.call(this);
    this.searchShapes(this.shapesData,this.viewData,this.dynamicProperties,[]);
    this.buildExpressionInterface();
};
CVShapeElement.prototype.searchShapes = function(arr,data,dynamicProperties,addedTrims){
    var i, len = arr.length - 1;
    var j, jLen;
    var ownArrays = [], ownTrims = [], styleElem;
    for(i=len;i>=0;i-=1){
        if(arr[i].ty == 'fl' || arr[i].ty == 'st'){
            styleElem = {
                type: arr[i].ty,
                elements: []
            };
            data[i] = {};
            data[i].c = PropertyFactory.getProp(this,arr[i].c,1,null,dynamicProperties);
            if(!data[i].c.k){
                styleElem.co = 'rgb('+bm_floor(data[i].c.v[0])+','+bm_floor(data[i].c.v[1])+','+bm_floor(data[i].c.v[2])+')';
            }
            data[i].o = PropertyFactory.getProp(this,arr[i].o,0,0.01,dynamicProperties);
            if(arr[i].ty == 'st') {
                styleElem.lc = this.lcEnum[arr[i].lc] || 'round';
                styleElem.lj = this.ljEnum[arr[i].lj] || 'round';
                if(arr[i].lj == 1) {
                    styleElem.ml = arr[i].ml;
                }
                data[i].w = PropertyFactory.getProp(this,arr[i].w,0,null,dynamicProperties);
                if(!data[i].w.k){
                    styleElem.wi = data[i].w.v;
                }
                if(arr[i].d){
                    var d = PropertyFactory.getDashProp(this,arr[i].d,'canvas',dynamicProperties);
                    data[i].d = d;
                    if(!data[i].d.k){
                        styleElem.da = data[i].d.dasharray;
                        styleElem.do = data[i].d.dashoffset;
                    }
                }

            }
            this.stylesList.push(styleElem);
            data[i].style = styleElem;
            ownArrays.push(data[i].style);
        }else if(arr[i].ty == 'gr'){
            data[i] = {
                it: []
            };
            this.searchShapes(arr[i].it,data[i].it,dynamicProperties,addedTrims);
        }else if(arr[i].ty == 'tr'){
            data[i] = {
                transform : {
                    mat: new Matrix(),
                    opacity: 1,
                    matMdf:false,
                    opMdf:false,
                    op: PropertyFactory.getProp(this,arr[i].o,0,0.01,dynamicProperties),
                    mProps: PropertyFactory.getProp(this,arr[i],2,null,dynamicProperties)
                },
                elements: []
            };
        }else if(arr[i].ty == 'sh' || arr[i].ty == 'rc' || arr[i].ty == 'el' || arr[i].ty == 'sr'){
            data[i] = {
                nodes:[],
                trNodes:[],
                tr:[0,0,0,0,0,0]
            };
            var ty = 4;
            if(arr[i].ty == 'rc'){
                ty = 5;
            }else if(arr[i].ty == 'el'){
                ty = 6;
            }else if(arr[i].ty == 'sr'){
                ty = 7;
            }
            if(addedTrims.length){
                arr[i].trimmed = true;
            }
            data[i].sh = PropertyFactory.getShapeProp(this,arr[i],ty,dynamicProperties, addedTrims);
            jLen = this.stylesList.length;
            var hasStrokes = false, hasFills = false;
            for(j=0;j<jLen;j+=1){
                if(!this.stylesList[j].closed){
                    this.stylesList[j].elements.push(data[i]);
                    if(this.stylesList[j].type === 'st'){
                        hasStrokes = true;
                    }else{
                        hasFills = true;
                    }
                }
            }
            data[i].st = hasStrokes;
            data[i].fl = hasFills;
        }else if(arr[i].ty == 'tm'){
            var trimOb = {
                closed: false,
                trimProp: PropertyFactory.getProp(this,arr[i],7,null,dynamicProperties)
            };
            addedTrims.push(trimOb);
            ownTrims.push(trimOb);
        }
    }
    len = ownArrays.length;
    for(i=0;i<len;i+=1){
        ownArrays[i].closed = true;
    }
    len = ownTrims.length;
    for(i=0;i<len;i+=1){
        ownTrims[i].closed = true;
    }
};

CVShapeElement.prototype.renderFrame = function(parentMatrix){
    if(this.parent.renderFrame.call(this, parentMatrix)===false){
        return;
    }
    this.renderShape(this.finalTransform,null,null,true);
    if(this.data.hasMask){
        this.globalData.renderer.restore(true);
    }
};

CVShapeElement.prototype.renderShape = function(parentTransform,items,data,isMain){
    var i, len;
    if(!items){
        items = this.shapesData;
        len = this.stylesList.length;
        for(i=0;i<len;i+=1){
            this.stylesList[i].d = '';
            this.stylesList[i].mdf = false;
        }
    }
    if(!data){
        data = this.viewData;
    }
    ///
    ///
    len = items.length - 1;
    var groupTransform,groupMatrix;
    groupTransform = parentTransform;
    for(i=len;i>=0;i-=1){
        if(items[i].ty == 'tr'){
            groupTransform = data[i].transform;
            var mtArr = data[i].transform.mProps.v.props;
            groupTransform.matMdf = groupTransform.mProps.mdf;
            groupTransform.opMdf = groupTransform.op.mdf;
            groupMatrix = groupTransform.mat;
            groupMatrix.cloneFromProps(mtArr);
            if(parentTransform){
                var props = parentTransform.mat.props;
                groupTransform.opacity = parentTransform.opacity;
                groupTransform.opacity *= data[i].transform.op.v;
                groupTransform.matMdf = parentTransform.matMdf ? true : groupTransform.matMdf;
                groupTransform.opMdf = parentTransform.opMdf ? true : groupTransform.opMdf;
                groupMatrix.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
            }else{
                groupTransform.opacity = groupTransform.op.o;
            }
        }else if(items[i].ty == 'sh' || items[i].ty == 'el' || items[i].ty == 'rc' || items[i].ty == 'sr'){
            this.renderPath(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'fl'){
            this.renderFill(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'st'){
            this.renderStroke(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'gr'){
            this.renderShape(groupTransform,items[i].it,data[i].it);
        }else if(items[i].ty == 'tm'){
            //
        }
    }
    if(!isMain){
        return;
    }
    len = this.stylesList.length;
    var j, jLen, k, kLen,elems,nodes, renderer = this.globalData.renderer, ctx = this.globalData.canvasContext, type;
    for(i=0;i<len;i+=1){
        type = this.stylesList[i].type;
        if(type === 'st' && this.stylesList[i].wi === 0){
            continue;
        }
        renderer.save();
        elems = this.stylesList[i].elements;
        jLen = elems.length;
        if(type === 'st'){
            ctx.strokeStyle = this.stylesList[i].co;
            ctx.lineWidth = this.stylesList[i].wi;
            ctx.lineCap = this.stylesList[i].lc;
            ctx.lineJoin = this.stylesList[i].lj;
            ctx.miterLimit = this.stylesList[i].ml || 0;
        }else{
            ctx.fillStyle = this.stylesList[i].co;
        }
        renderer.ctxOpacity(this.stylesList[i].coOp);
        if(type !== 'st'){
            ctx.beginPath();
        }
        for(j=0;j<jLen;j+=1){
            if(type === 'st'){
                renderer.save();
                ctx.beginPath();
                if(this.stylesList[i].da){
                    ctx.setLineDash(this.stylesList[i].da);
                    ctx.lineDashOffset = this.stylesList[i].do;
                    this.globalData.isDashed = true;
                }else if(this.globalData.isDashed){
                    ctx.setLineDash(this.dashResetter);
                    this.globalData.isDashed = false;
                }
                renderer.ctxTransform(elems[j].tr);
                nodes = elems[j].nodes;
            }else{
                nodes = elems[j].trNodes;
            }
            kLen = nodes.length;

            for(k=0;k<kLen;k+=1){
                if(nodes[k].t == 'm'){
                    ctx.moveTo(nodes[k].p[0],nodes[k].p[1]);
                }else{
                    ctx.bezierCurveTo(nodes[k].p1[0],nodes[k].p1[1],nodes[k].p2[0],nodes[k].p2[1],nodes[k].p3[0],nodes[k].p3[1]);
                }
            }
            if(type === 'st'){
                ctx.stroke();
                renderer.restore();
            }
        }
        if(type !== 'st'){
            ctx.fill();
        }
        renderer.restore();
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};
CVShapeElement.prototype.renderPath = function(pathData,viewData,groupTransform){
    var len, i;
    var pathNodes = viewData.sh.v;
    if(pathNodes.v){
        len = pathNodes.v.length;
        var redraw = groupTransform.matMdf || viewData.sh.mdf || this.firstFrame;
        if(redraw) {
            var pathStringTransformed = viewData.trNodes;
            var pathStringNonTransformed = viewData.nodes;
            pathStringTransformed.length = 0;
            pathStringNonTransformed.length = 0;
            var stops = pathNodes.s ? pathNodes.s : [];
            for (i = 1; i < len; i += 1) {
                if (stops[i - 1]) {
                    if (viewData.st) {
                        pathStringNonTransformed.push({
                            t:'m',
                            p:stops[i - 1]
                        });
                    }
                    if (viewData.fl) {
                        pathStringTransformed.push({
                            t:'m',
                            p:groupTransform.mat.applyToPointArray(stops[i - 1][0], stops[i - 1][1], 0)
                        });
                    }
                } else if (i == 1) {
                    if (viewData.st) {
                        pathStringNonTransformed.push({
                            t:'m',
                            p:pathNodes.v[0]
                        });
                    }

                    if (viewData.fl) {
                        pathStringTransformed.push({
                            t:'m',
                            p:groupTransform.mat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                        });
                    }
                }
                if (viewData.st) {
                    pathStringNonTransformed.push({
                        t:'c',
                        p1:pathNodes.o[i - 1],
                        p2:pathNodes.i[i],
                        p3:pathNodes.v[i]
                    });
                }

                if (viewData.fl) {
                    pathStringTransformed.push({
                        t:'c',
                        p1:groupTransform.mat.applyToPointArray(pathNodes.o[i - 1][0],pathNodes.o[i - 1][1], 0),
                        p2:groupTransform.mat.applyToPointArray(pathNodes.i[i][0], pathNodes.i[i][1], 0),
                        p3:groupTransform.mat.applyToPointArray(pathNodes.v[i][0], pathNodes.v[i][1], 0)
                    });
                }
            }
            if (len == 1) {
                if (stops[0]) {
                    if (viewData.st) {
                        pathStringNonTransformed.push({
                            t:'m',
                            p:stops[0]
                        });
                    }
                    if (viewData.fl) {
                        pathStringTransformed.push({
                            t:'m',
                            p:groupTransform.mat.applyToPointArray(stops[0][0], stops[0][1], 0)
                        });
                    }
                } else {
                    if (viewData.st) {
                        pathStringNonTransformed.push({
                            t:'m',
                            p:pathNodes.v[0]
                        });
                    }
                    if (viewData.fl) {
                        pathStringTransformed.push({
                            t:'m',
                            p:groupTransform.mat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                        });
                    }
                }
            }
            if (len && pathData.closed && !(pathData.trimmed && !pathNodes.c)) {
                if (viewData.st) {
                    pathStringNonTransformed.push({
                        t:'c',
                        p1:pathNodes.o[i - 1],
                        p2:pathNodes.i[0],
                        p3:pathNodes.v[0]
                    });
                }
                if (viewData.fl) {
                    pathStringTransformed.push({
                        t:'c',
                        p1:groupTransform.mat.applyToPointArray(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1], 0),
                        p2:groupTransform.mat.applyToPointArray(pathNodes.i[0][0], pathNodes.i[0][1], 0),
                        p3:groupTransform.mat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                    });
                }
            }
            if (viewData.st) {
                for(i=0;i<16;i+=1){
                    viewData.tr[i] = groupTransform.mat.props[i];
                }
            }
            viewData.nodes = pathStringNonTransformed;
            viewData.trNodes = pathStringTransformed;
        }
    }
};



CVShapeElement.prototype.renderFill = function(styleData,viewData, groupTransform){
    var styleElem = viewData.style;

    if(viewData.c.mdf || this.firstFrame){
        styleElem.co = 'rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')';
    }
    if(viewData.o.mdf || groupTransform.opMdf || this.firstFrame){
        styleElem.coOp = viewData.o.v*groupTransform.opacity;
    }
};

CVShapeElement.prototype.renderStroke = function(styleData,viewData, groupTransform){
    var styleElem = viewData.style;
    //TODO fix dashes
    var d = viewData.d;
    var dasharray,dashoffset;
    if(d && (d.mdf  || this.firstFrame)){
        styleElem.da = d.dasharray;
        styleElem.do = d.dashoffset;
    }
    if(viewData.c.mdf || this.firstFrame){
        styleElem.co = 'rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')';
    }
    if(viewData.o.mdf || groupTransform.opMdf || this.firstFrame){
        styleElem.coOp = viewData.o.v*groupTransform.opacity;
    }
    if(viewData.w.mdf || this.firstFrame){
        styleElem.wi = viewData.w.v;
    }
};


CVShapeElement.prototype.destroy = function(){
    this.shapesData = null;
    this.globalData = null;
    this.canvasContext = null;
    this.stylesList.length = 0;
    this.viewData.length = 0;
    this.parent.destroy.call();
};
extendPrototype(ShapeInterface,CVShapeElement);