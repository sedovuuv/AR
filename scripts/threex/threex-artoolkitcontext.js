var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Context = THREEx.ArToolkitContext = function(parameters){
	var _this = this

	_this._updatedAt = null

	this.parameters = {
		trackingBackend: 'artoolkit',
		debug: false,
		detectionMode: 'mono',
		matrixCodeType: '3x3',

		cameraParametersUrl: ARjs.Context.baseURL + 'parameters/camera_para.dat',

		maxDetectionRate: 60,
		canvasWidth: 640,
		canvasHeight: 480,

		patternRatio: 0.5,

		imageSmoothingEnabled : false,
	}
	console.assert(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)

        this.arController = null;
        this.arucoContext = null;

	_this.initialized = false


	this._arMarkersControls = []

	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

Object.assign( ARjs.Context.prototype, THREE.EventDispatcher.prototype );
ARjs.Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
ARjs.Context.REVISION = '1.6.0'



/**
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Context.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)
	return camera
}

ARjs.Context.prototype.init = function(onCompleted){
	var _this = this
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done)
	}else console.assert(false)
	return

	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		_this.initialized = true

		onCompleted && onCompleted()
	}

}
ARjs.Context.prototype.update = function(srcElement){

    if(this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement)
	}else{
		console.assert(false)
	}

	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	return true;
}

ARjs.Context.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

ARjs.Context.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}

ARjs.Context.prototype._initArtoolkit = function(onCompleted){
        var _this = this

	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

        var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function(){
            var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
            _this.arController = arController

			arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
			arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
			arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
			arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

        if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute'
			arController.canvas.style.top = '0px'
			arController.canvas.style.opacity = '0.6'
			arController.canvas.style.pointerEvents = 'none'
			arController.canvas.style.zIndex = '-1'
		}

		var detectionModes = {
			'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		}
		var detectionMode = detectionModes[_this.parameters.detectionMode]
		console.assert(detectionMode !== undefined)
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		}
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
		console.assert(matrixCodeType !== undefined)
		arController.setMatrixCodeType(matrixCodeType);

		arController.setPattRatio(_this.parameters.patternRatio);

		        onCompleted()
        })
	return this
}

ARjs.Context.prototype.getProjectionMatrix = function(srcElement){


	console.assert( this.parameters.trackingBackend === 'artoolkit' )
	console.assert(this.arController, 'arController MUST be initialized to call this function')
	var projectionMatrixArr = this.arController.getCameraMatrix();
	var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)

	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)

	return projectionMatrix
}

ARjs.Context.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}
ARjs.Context.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	var context = this.arucoContext.canvas.getContext('2d')
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;


	setTimeout(function(){
		onCompleted()
	}, 0)
}


ARjs.Context.prototype._updateAruco = function(srcElement){
	var _this = this
	var arMarkersControls = this._arMarkersControls
        var detectedMarkers = this.arucoContext.detect(srcElement)

	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' )
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}
ARjs.Context.prototype._initTango = function(onCompleted){
	var _this = this
	if (navigator.getVRDisplays){
	} else if (navigator.getVRDevices){
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	}


	navigator.getVRDisplays().then(function (vrDisplays){
		if( vrDisplays.length === 0 )	alert('no vrDisplays available')
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0]

		console.log('vrDisplays.displayName :', vrDisplay.displayName)

		if( vrDisplay.displayName === "Tango VR Device" ){
                	_this._tangoContext.vrPointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true)
		}

		onCompleted()
	});
}


ARjs.Context.prototype._updateTango = function(srcElement){
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var tangoContext= this._tangoContext
	var vrDisplay = this._tangoContext.vrDisplay

	if( vrDisplay === null )	return


	if( vrDisplay.displayName === "Tango VR Device" ){
	        var showPointCloud = true
		var pointsToSkip = 0
	        _this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true)
	}


	if( this._arMarkersControls.length === 0 )	return


	var foundControls = this._arMarkersControls[0]

	var frameData = this._tangoContext.frameData

	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	var position = new THREE.Vector3().fromArray(frameData.pose.position)
	var quaternion = new THREE.Quaternion().fromArray(frameData.pose.orientation)
	var scale = new THREE.Vector3(1,1,1)
	var cameraTransformMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse( cameraTransformMatrix )

	foundControls.updateWithModelViewMatrix(modelViewMatrix)
}