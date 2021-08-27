class Point3D{
    constructor(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    addition(point){
        return new Point3D(this.x + point.x, this.y + point.y, this.z + point.z);
    }

    difference(point){
        return new Point3D(this.x - point.x, this.y - point.y, this.z - point.z);
    }

    times(n){
        return new Point3D(this.x * n, this.y * n, this.z * n);
    }

    getPosition(){
        return {
            x: this.x,
            y: this.y,
            z: this.z,
        }
    }

    valueBetween(point, travel){
        const posDiff = this.difference(point);
        // console.log( this.addition( point.difference(this).times(travel) ) );
        return this.addition( point.difference(this).times(travel) ).getPosition();
    }
}

/*****************************/
class StepEntity{
    constructor(options = {}){
        const defaultOptions = {
            entity: null,
            attributes: null,
            manual: false,
            callback: null,
        };

        for(var optionName in defaultOptions){
            this[optionName] = options.hasOwnProperty(optionName) ? options[optionName] : defaultOptions[optionName];
        }
    }

    numberBetween(a, b, traveled){
        return (a + traveled * (b - a));
    }

    update(traveled){
        //If it has a custom function that works with the position
        if(this.manual && this.callback){
            this.callback(traveled);
            return true;
        }
        //If not, continue with normal workflow

        if(!this.attributes)
            return false;

        for(var attributeName in this.attributes){
            const attributeData = this.attributes[attributeName];
            const initialVal = attributeData.initialVal;
            const finalVal = attributeData.finalVal;
            const valBetween = initialVal.valueBetween ? initialVal.valueBetween(finalVal, traveled) : this.numberBetween(initialVal, finalVal, traveled);
            // console.log(attributeName, valBetween);
            this.entity.setAttribute(attributeName, valBetween);
        }
    }
}

class StepAnimation{
    constructor(options = {}){
        console.log(options);
        const defaultOptions = {
            /**
            *   @property {jQuery} $elem - an element that indicates the limits of the steps.
            *   If not passed, initOffset and endOffset should be setted
            */
            $elem: null,
            /**
            *   @property {number} initOffset - The offset from the document that indicates the beginning of the step
            */
            initOffset: null,
            /**
            *   @property {number} endOffset - The offset from the document that indicates the end of the step
            */
            endOffset: null,
            /**
            *   @property {bool} startOnView - If the animation should start as soon as the initOffset comes into view.
            *   If false, the animation starts when the window offset top reaches the initOffset
            */
            startOnView: false,
            /**
            *   @property {function} onEnter - A function to run when entering the step
            */
            onEnter: null,
            /**
            *   @property {function} onEnter - A function to run when exiting the step
            */
            onExit: null,
            /**
            *   @property {function} onEnter - A function to run while traversing the step
            */
            callback: null,
            /**
            *   @property {StepAnimation[]} dependencies - An array of other StepAnimation that should be done before this one starts
            */
            dependencies: null,
            /**
            *   @property {mixed[]} entities
            */
            entities: null,
        };

        for(var optionName in defaultOptions){
            this[optionName] = options.hasOwnProperty(optionName) ? options[optionName] : defaultOptions[optionName];
        }

        console.log(this);
        this.init();
    }

    getInitOffset(){
        var initialOffset = this.initOffset;
        if(this.$elem){
            initialOffset = this.$elem.offset().top;
            if(this.startOnView)
                initialOffset -= window.innerHeight; //Hay que tener en cuenta que pasa cuando el offsetTop es menor que el tamaño de la pantalla!!!!
        }
        return initialOffset;
    }

    getEndOffset(){
        return this.$elem ? this.$elem.offset().top + this.$elem.innerHeight() : this.endOffset;
    }

    isInView(){
        let windowScrollTop = $(window).scrollTop();
        return windowScrollTop >= this.getInitOffset() && windowScrollTop <= this.getEndOffset();
    }

    isBefore(){
        return $(window).scrollTop() < this.getInitOffset();
    }

    isAfter(){
        return $(window).scrollTop() > this.getEndOffset();
    }

    /**
    *   @return {float} how long the step is from the start to the end
    */
    getLength(){
        return this.getEndOffset() - this.getInitOffset();
    }

    /**
    *   Distance scrolled in the step. On update, the current travel is set on currentTravel.
    *   @return {float} percentage of the distance traveled (0 to 1)
    */
    traveled(){
        return ($(window).scrollTop() - this.getInitOffset()) * 1 / this.getLength();
    }

    updateEntities(options = {}){
        if(!this.entities)
            return false;
        var {traveled = this.currentTravel} = options;
        // console.log(steps);
        for(let i = 0; i < this.entities.length; i++){
            this.entities[i].update(traveled);
        }
    }

    goTo(travel){
        if(this.callback)
            this.callback(travel, this);
        this.updateEntities({
            traveled: travel,
        });
    }

    //Goes to the end of the step animation
    finish(){
        this.goTo(1);
    }

    //Goes to the beginning part of the step animation
    start(){
        this.goTo(0);
    }

    hasDependencies(){
        return this.dependencies && this.dependencies.length;
    }

    update(){
        this.currentTravel = this.traveled();
        if(this.isInView()){
            // console.log('In view', this.traveled());
            // this.updateCurrentSteps();
            this.goTo(this.currentTravel);
        }
        else{
            if(this.isBefore() && (this.previousTravel == null || this.previousTravel >= 0)){
                console.log('Before');
                if(!this.hasDependencies())
                    this.start();
            }
            else if(this.isAfter() && (this.previousTravel == null || this.previousTravel <= 1)){
                console.log('After');
                this.finish();
            }
        }
        this.previousTravel = this.currentTravel;
    }

    initEntities(){
        if(!this.entities)
            return false;
        console.log('Initializing entities');
        for(let i = 0; i < this.entities.length; i++){
            this.entities[i] = new StepEntity(this.entities[i]);
        }
    }

    init(){
        if(!this.$elem && this.initOffset == null && this.endOffset == null)
            return false;

        const _this = this;
        this.initEntities();
        this.update();
        $(window).on('scroll', function(){
            _this.update();
        });
    }
}
