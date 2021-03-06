function EffectsManager(data,element,dynamicProperties){
    this.data = data;
    this.element = element;
    var effects = data.ef;
    this.effectElements = [];
    var i,len = effects.length;
    var eff;
    for(i=0;i<len;i++){
        switch(effects[i].ty){
            case 0:
                eff = new SliderEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff.proxyFunction.bind(eff));
                break;
            case 1:
;                eff = new AngleEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff.proxyFunction.bind(eff));
                break;
            case 2:
                eff = new ColorEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff.proxyFunction.bind(eff));
                break;
            case 3:
                eff = new PointEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff.proxyFunction.bind(eff));
                break;
            case 4:
                eff = new CheckboxEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff.proxyFunction.bind(eff));
                break;
        }
    }
}

EffectsManager.prototype.getEffect = function(name){
    var effects = this.data.ef, i = 0, len = effects.length;
    while(i<len) {
        if(effects[i].nm === name){
            return this.effectElements[i];
        }
        i += 1;
    }
};