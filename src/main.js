const THREE = require('three');
import Framework from './framework'

var CameraShot = {
  INTRO : 0,
  MAIN : 1,
  CEILING : 2,
  OVERVIEW : 3
}

var State = {
  NONE : 0,
  INTRO : 1,
  DROP : 2,
  MAIN : 3
};

var SubState = {
  NONE : 0,
  D1 : 1,
  D2 : 2,
}

var Engine = {
  initialized : false,
  scene : null,
  renderer : null,

  camera : null,
  cameraTime : 0,
  
  time : 0.0,
  clock : null,

  music : null,
  
  currentState : State.NONE,
  currentSubState : SubState.NONE,
  currentCameraShot : CameraShot.INTRO,

  cinematicElements : [], // This will contain all scene objects
  // It will contain a material, a possible mesh, an internal time and a possible update function per state

  materials : []
}

// Boilerplate stuff, inefficient but fast to code :3
function loadMesh(objName, func)
{    
    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/' + objName, function(obj) {
        obj.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
            func(child);
          }
        });

    });
}

function loadBackground()
{
    var cinematicBarsMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
        },
        vertexShader: require("./shaders/cinematic_bars.vert.glsl"),
        fragmentShader: require("./shaders/cinematic_bars.frag.glsl")
    });

    cinematicBarsMaterial.depthWrite = false;
    cinematicBarsMaterial.depthTest = false;
    cinematicBarsMaterial.side = THREE.DoubleSide;
    cinematicBarsMaterial.order

    loadMesh('cinematic_bars.obj', function(mesh) {
        mesh.material = cinematicBarsMaterial;
        mesh.renderOrder = 10; // This is the last thing rendered
        Engine.scene.add(mesh);
    });

    var floorMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
        },
        vertexShader: require("./shaders/floor.vert.glsl"),
        fragmentShader: require("./shaders/floor.frag.glsl")
    });

    loadMesh('floor.obj', function(mesh) {
        mesh.material = floorMaterial;
        Engine.scene.add(mesh);
    });

    var cinematicElement = {
        time : 0.0,
        material : null
    }

    return cinematicElement;
}

function loadWings()
{
    var wingMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

    var cinematicElements = [];

    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/feather.obj', function(obj) {
        var featherGeo = obj.children[0].geometry;
        var featherMesh = new THREE.Mesh(featherGeo, wingMaterial);
        Engine.scene.add(featherMesh);

        cinematicElements.push({            
        });
    });

    var cinematicElement = {
        time : 0.0,
        material : null
    }

    return cinematicElement;
}

function LoadCinematicElement(func)
{
    var e = func();

    Engine.cinematicElements.push(e);

    if(e.material != null)
        Engine.materials.push(e.material);

    if(e.materials != null)
    {
        for (var i = 0; i < e.materials.length; i++)
            Engine.materials.push(e.materials[i]);
    }
}

function onLoad(framework) 
{
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;

    // Init Engine stuff
    Engine.scene = scene;
    Engine.renderer = renderer;
    Engine.clock = new THREE.Clock();
    Engine.camera = camera;

    camera.fov = 25;
    camera.position.set(0, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));

    LoadCinematicElement(loadBackground);
    // LoadCinematicElement(loadWings);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    // gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    //     camera.updateProjectionMatrix();
    // });

    Engine.initialized = true;
}

// called on frame updates
function onUpdate(framework) 
{
    if(Engine.initialized)
    {
        var screenSize = new THREE.Vector2( framework.renderer.getSize().width, framework.renderer.getSize().height );
        var deltaTime = Engine.clock.getDelta();

        Engine.time += deltaTime;
        Engine.cameraTime += deltaTime;

        // Update materials code
        for (var i = 0; i < Engine.materials.length; i++)
        {
          var material = Engine.materials[i];

          material.uniforms.time.value = Engine.time;

          // for ( var property in material.uniforms ) 
          // {
          //   if(UserInput[property] != null)
          //     material.uniforms[property].value = UserInput[property];
          // }

          if(material.uniforms["SCREEN_SIZE"] != null)
            material.uniforms.SCREEN_SIZE.value = screenSize;
        }
    }

    // var feather = framework.scene.getObjectByName("feather");    
    // if (feather !== undefined) {
    //     // Simply flap wing
    //     var date = new Date();
    //     feather.rotateZ(Math.sin(date.getTime() / 100) * 2 * Math.PI / 180);        
    // }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);