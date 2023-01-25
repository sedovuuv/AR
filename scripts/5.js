let scene, camera, renderer, clock, dTime, tTime;
let arToolkitSource, arToolkitContext;
let markerRoot1;
let mesh1;

initialize();
animate();

function initialize(){
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
	scene.add(ambientLight);
				
	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize(640, 480);
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild(renderer.domElement);

	clock = new THREE.Clock();
	dTime = 0;
	tTime = 0;
	

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if (arToolkitContext.arController !== null){
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});
	
	window.addEventListener('resize', function(){
		onResize()
	});
	
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
	});

	markerRoot1 = new THREE.Group();
	scene.add(markerRoot1);
	let markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
		type: 'pattern', patternUrl: "data/hiro.patt",
	})

	let geometry1 = new THREE.PlaneBufferGeometry(2,2, 4,4);

	let video = document.getElementById('video');
	let texture = new THREE.VideoTexture(video);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;
	let material1 = new THREE.MeshBasicMaterial({ map: texture });
	
	mesh1 = new THREE.Mesh(geometry1, material1);
	mesh1.rotation.x = -Math.PI/2;
	
	markerRoot1.add(mesh1);
}


function update(){
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);
}


function render(){
	renderer.render( scene, camera );
}


function animate(){
	requestAnimationFrame(animate);
	dTime = clock.getDelta();
	tTime += dTime;
	update();
	render();
}
