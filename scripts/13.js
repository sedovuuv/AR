let scene, camera, renderer, clock, deltaTime, totalTime;

let arToolkitSource, arToolkitContext;

let patternArray, markerRootArray, markerGroupArray;
let sceneGroup;

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 0.5 );
	scene.add( ambientLight );
				
	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 640, 480 );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
	
	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
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
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	markerRootArray  = [];
	markerGroupArray = [];
	patternArray = ["letterA", "letterB", "letterC", "letterD", "letterF", "kanji"];
	
	let rotationArray = [ new THREE.Vector3(-Math.PI/2,0,0), new THREE.Vector3(0,-Math.PI/2,Math.PI/2), new THREE.Vector3(Math.PI/2, 0, Math.PI), 
		new THREE.Vector3(-Math.PI/2,Math.PI/2,0), new THREE.Vector3(Math.PI,0,0), new THREE.Vector3(0,0,0) ];
		
	for (let i = 0; i < 6; i++)
	{
		let markerRoot = new THREE.Group();
		markerRootArray.push( markerRoot );
		scene.add(markerRoot);
		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
			type : 'pattern', patternUrl : "data/" + patternArray[i] + ".patt",
		});
	
		let markerGroup = new THREE.Group();
		markerGroupArray.push( markerGroup );
		markerGroup.position.y = -1.25/2;
		markerGroup.rotation.setFromVector3( rotationArray[i] );
		
		markerRoot.add( markerGroup );
	}
	
	sceneGroup = new THREE.Group();
	sceneGroup.scale.set(1.25/2, 1.25/2, 1.25/2);
	
	let loader = new THREE.TextureLoader();

	let tileTexture = loader.load("images/tiles.jpg");
	sceneGroup.add( 
		new THREE.Mesh(
			new THREE.BoxGeometry(2,2,2),
			new THREE.MeshBasicMaterial({
				map: tileTexture,
				side: THREE.BackSide,
			})
		)
	);
	
		
	let sphereGeometry = new THREE.SphereGeometry(0.15, 6,6);
	
	let sphereCenters = [ 
		new THREE.Vector3(-1,-1,-1), new THREE.Vector3(-1,-1,1), new THREE.Vector3(-1,1,-1), new THREE.Vector3(-1,1,1),
		new THREE.Vector3( 1,-1,-1), new THREE.Vector3( 1,-1,1), new THREE.Vector3( 1,1,-1), new THREE.Vector3( 1,1,1),
	];
	
	let sphereColors = [ 0x444444, 0x0000ff, 0x00ff00, 0x00ffff, 0xff0000, 0xff00ff, 0xffff00, 0xffffff ];
	
	for (let i = 0; i < 8; i++)
	{
		let sphereMesh = new THREE.Mesh( 
			sphereGeometry, 
			new THREE.MeshLambertMaterial({
				map: tileTexture,
				color: sphereColors[i]
			})
		);
		sphereMesh.position.copy( sphereCenters[i] );
		sceneGroup.add(sphereMesh);
	}
	
	
}


function update()
{
		if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
	
	for (let i = 0; i < 6; i++)
	{
		if ( markerRootArray[i].visible )
		{
			markerGroupArray[i].add( sceneGroup );
			console.log("visible: " + patternArray[i]);
			break;
		}
	}
	
}


function render()
{
	renderer.render( scene, camera );
}


function animate()
{
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}
