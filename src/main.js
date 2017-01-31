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
    objLoader.load('/geo/' + objName + '.obj', function(obj) {
        obj.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
            func(child);
          }
        });

    });
}

function loadBackground()
{   

    var floorMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: "f", value : 0.0 },
            gradientTexture: { type: "t", value: THREE.ImageUtils.loadTexture("/images/gradient_floor.png")}
        },
        vertexShader: require("./shaders/floor.vert.glsl"),
        fragmentShader: require("./shaders/floor.frag.glsl")
    });

    loadMesh('floor', function(mesh) {
        mesh.material = floorMaterial;
        Engine.scene.add(mesh);
    });

    var cinematicBarsMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
        },
        vertexShader: require("./shaders/cinematic_bars.vert.glsl"),
        fragmentShader: require("./shaders/cinematic_bars.frag.glsl")
    });

    cinematicBarsMaterial.depthFunc = THREE.AlwaysDepth;
    cinematicBarsMaterial.depthWrite = false;
    cinematicBarsMaterial.depthTest = false;
    cinematicBarsMaterial.side = THREE.DoubleSide;

    loadMesh('cinematic_bars', function(mesh) {
        mesh.material = cinematicBarsMaterial;
        mesh.renderOrder = 10; // This is the last thing rendered
        Engine.scene.add(mesh);
    });

    var cinematicElement = {
        time : 0.0,
        material : null
    }

    return cinematicElement;
}

// A good curve seems to be: (log(x * .5) + 2) * .2  + .5 + x*x*x*x * .25
// The derivative is close to (1/x)*.1 + .25 * 4 * x * x * x
function wingPositionFunction(t)
{
    var height = .25;

    var p0 = new THREE.Vector3(0,0,0);
    var p1 = new THREE.Vector3(0,0,1);

    var p2 = new THREE.Vector3(0,0,1);
    var p3 = new THREE.Vector3(1,0,1);

    var curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

    return curve.getPoint(t);
}

function wingPositionFunctionDeriv(x)
{
    return (1.0/(x + .001)) * .1 + .25 * 4 * x * x * x;
}

function lerp(a, b, x)
{
    return a * (1 - x) + b * x;
}

// -scale, +scale
function randomPoint(scale = 1)
{
    return new THREE.Vector3( (Math.random() * 2 - 1) * scale, (Math.random() * 2 - 1) * scale, (Math.random() * 2 - 1) * scale);
}

function GetWingConstructionCurve()
{
    return new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 0,0,0),
        new THREE.Vector3(0.764, 0, -0.289),
        new THREE.Vector3( 1.58, 0, -0.85),
        new THREE.Vector3(2.084, 0, -1.649),
        new THREE.Vector3( 2.067, 0, -2.279),
        new THREE.Vector3( 1.377, 0, -2.82),
        new THREE.Vector3(0.389, 0, -2.763),
        new THREE.Vector3(0.618, 0, -3.764 ),        
        new THREE.Vector3(2.122, 0, -4.35 ),        
        new THREE.Vector3(2.864, 0, -5.434)
    ] );
}

function GetWingEndCurve()
{
    return new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 0.782,0,2.234 ),
        new THREE.Vector3(2.16, 0,0.633),
        new THREE.Vector3(6.492, 0, 0.0634),
        new THREE.Vector3(10.339, 0, -1.792),
        new THREE.Vector3(13.309, 0, -4.932),
        new THREE.Vector3(15.116, 0, -9.76),
        
        new THREE.Vector3(13.894, 0,-14.966),
        new THREE.Vector3(9.283, 0, -16.189 ),        
        new THREE.Vector3(3.805, 0, -14.055 )
    ] );
}

function GetWingTransversalCurves()
{
    var curve1 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 2.854,0,-5.411),
        new THREE.Vector3( 4.403, 0, -8.245),
        new THREE.Vector3( 4.837, 0, -11.39),
        new THREE.Vector3( 3.598, 0, -14.107)
    ] );

    var curve2 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3(2.074,0,-4.508 ),
        new THREE.Vector3(3.514, 0, -4.572),
        new THREE.Vector3( 4.581, 0, -5.635),
        new THREE.Vector3(5.83, 0, -7.393),
        new THREE.Vector3(8.065, 0, -7.841),
        new THREE.Vector3(10.112, 0, -6.005),        
        new THREE.Vector3( 14.545, 0, -8.971 )
    ] );

    var curve3 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 0.606,0,-3.036),
        new THREE.Vector3(3.603, 0, -2.968),
        new THREE.Vector3( 5.885, 0, -4.939),
        new THREE.Vector3( 8.237, 0, -4.117),
        
        new THREE.Vector3(8.781, 0, -2.514 ),
        new THREE.Vector3(10.309, 0,-2.289)        
    ] );

    var curve4 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 2.93, 0, -2.035),
        new THREE.Vector3( 3.731, 0, -1.757 ),
        new THREE.Vector3( 4.104, 0, -1.027),
        new THREE.Vector3( 4.204, 0, -0.17),        
        new THREE.Vector3( 5.504, 0,0.0414)        
    ] );

    var curve5 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 1.791, 0, -0.765),
        new THREE.Vector3( 2.248, 0, -0.446 ),        
        new THREE.Vector3( 2.278, 0, 0.232),
        new THREE.Vector3( 2.914, 0, 0.42 )    
    ] );

    var curve6 = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 0.735, 0, -0.0649),
        new THREE.Vector3( 0.724, 0, 0.469 ),        
        new THREE.Vector3( 0.807, 0, 1.193),
        
        new THREE.Vector3( 1.174, 0, 1.418 )    
    ] );

    var curves = [];

    curves.push(curve6);
    curves.push(curve5);
    curves.push(curve4);
    curves.push(curve3);
    curves.push(curve2);
    curves.push(curve1);
    return curves;
}

function loadWingConstructionCurves()
{
    var curve = GetWingConstructionCurve();
    var transversalCurves = GetWingTransversalCurves();

    for(var i = 0; i < transversalCurves.length; i++)
    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = transversalCurves[i].getPoints(20);

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x0000ff } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }

    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = curve.getPoints( 100 );

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }

    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = GetWingEndCurve().getPoints( 100 );

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }
}

function evaluateCurveLoft(transversalCurves, u, v)
{
    var curveCount = transversalCurves.length;    
    var parameterSubdivision = [ .1, .15, .15, .3, .3];

    var x = u;
    var index = -1;

    for(var i = 0; i < curveCount; i++)
    {
        if( x - parameterSubdivision[i] < 0)
        {
            index = i;
            x = x / parameterSubdivision[i];
            break;
        }
        else
        {
            x -= parameterSubdivision[i];
        }
    }

    // console.log(x + ', ' + index);

    var currentIndex = index;
    var t = THREE.Math.smootherstep(x, 0, 1);

    if(currentIndex > 0)
    {
        var prevPoint = transversalCurves[currentIndex - 1].getPoint(v);
        var currentPoint = transversalCurves[currentIndex].getPoint(v);

        return prevPoint.lerp(currentPoint, t);
    }
    else
    {
        var currentPoint = transversalCurves[currentIndex].getPoint(v);

        var lastPoint = transversalCurves[currentIndex].getPoint(1.0);
        return currentPoint.lerp(lastPoint, t);
    }
}

function loadWings()
{
    var featherMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
        },
        vertexShader: require("./shaders/feather.vert.glsl"),
        fragmentShader: require("./shaders/feather.frag.glsl")
    });

    var cinematicElements = [];

    var curve = GetWingConstructionCurve();
    var transversalCurves = GetWingTransversalCurves();

    var container = new THREE.Object3D();
    container.position.set(0,.9,0);
    Engine.scene.add(container);

    loadMesh('wing_start', function(mesh) {
        mesh.material = featherMaterial;

        var feathers = [];
        var feathersToAdd = 75;

        // First, big feathers
        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = i / feathersToAdd;

            var feather = mesh.clone();
            feather.userData = { t : x };
            feathers.push(feather);

            var tangent = curve.getTangent(x);
            var normal = new THREE.Vector3( -tangent.z, 0, tangent.x);
            var position = curve.getPoint(x);// new THREE.Vector3(x, .1, 0.0);


            // position = evaluateCurveLoft(transversalCurves, x, 0);

            var target = evaluateCurveLoft(transversalCurves, x, 0);
            // position.add(wingPositionFunction(x));
            // position.add(randomPoint(.025));


            // var direction = new THREE.Vector3( -wingPositionFunctionDeriv(x), 0, x );
            // direction.multiplyScalar(.1);
            // position.add(direction);
            // position.add(new THREE.Vector3(0.0, l * .1, 0.0));

            var scale = new THREE.Vector3( 2, .1, .1 );
            // var scale = new THREE.Vector3(.2 + wingPositionFunction(x) * .25 + Math.sin(x*3.14 * .8 - 1.5) * .05, .5, .2 + x * .2);
            // scale.add(randomPoint(.2 * x));

            feather.position.copy(position);
            feather.scale.copy(scale);


            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);    
            // feather.lookAt(position.clone().add(tangent.clone().negate()));

            // f.rotation.set(0, 3.14, 0);
            // feather.rotation.set(.15, lerp(3.14, 5.25, x*x), .05);
            // feather.rotateX(.35);

            // position.add(direction);
            // f.lookAt(position);
            container.add(feather);
        }

        feathersToAdd = 50;

        // // Secondary small feathers on top
        // for(var i = 0; i < feathersToAdd; i++)
        // {
        //     var x = i / feathersToAdd;

        //     var feather = mesh.clone();
        //     feather.userData = { t : x };
        //     feathers.push(feather);

        //     var position = new THREE.Vector3(x, .11, wingPositionFunction(x) * 1.5);
        //     position.add(randomPoint(.015 * x));

        //     // var direction = new THREE.Vector3( -wingPositionFunctionDeriv(x), 0, x );
        //     // direction.multiplyScalar(.1);
        //     // position.add(direction);
        //     // position.add(new THREE.Vector3(0.0, l * .1, 0.0));

        //     var scale = new THREE.Vector3(.1 + wingPositionFunction(x) * .2 + Math.sin(x*3.14 * .8 - 1.5) * .03, .5, .2 + x * .3);
        //     scale.add(randomPoint(.05 * x * x));

        //     feather.position.copy(position);
        //     feather.scale.copy(scale);
        //     // f.rotation.set(0, 3.14, 0);
        //     feather.rotation.set(0, lerp(3.14, 5.25, x*x), 0);
        //     feather.rotateX(.25);

        //     // position.add(direction);
        //     // f.lookAt(position);
        //     Engine.scene.add(feather);
        // }
    });



    // loadMesh('angel', function(mesh) {
    //     mesh.material = wingMaterial;
    //     Engine.scene.add(mesh);

    //     cinematicElements.push({

    //     });
    // });

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
    camera.position.set(0, 3, .1);
    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.rotateZ(3.14 * -.5);

    LoadCinematicElement(loadBackground);
    LoadCinematicElement(loadWings);
    loadWingConstructionCurves();

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