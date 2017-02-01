const THREE = require('three');
import Framework from './framework'

var CameraShot = {
  INTRO_D1 : 0,
  INTRO_D2 : 1,
  INTRO_D3 : 2,
  INTRO_D4 : 3,

  MAIN_D1 : 4,
  CEILING : 5,
  OVERVIEW : 6
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
  cameraControllers : [],
  currentCameraIndex : 0,
  cameraTime : 0,
  
  time : 0.0,
  deltaTime : 0.0,
  clock : null,

  music : null,

  loadingBlocker : null,
  desintegrationFactor : 0.0,
  wingMaterial : null,
  desintegrate : true,
  
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
    objLoader.load('./geo/' + objName + '.obj', function(obj) {
        obj.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
            func(child);
          }
        });
    });
}

function loadFlags()
{
    var flagMaterial = new THREE.ShaderMaterial({
        vertexColors: THREE.VertexColors,
        uniforms: {
          time: { type: "f", value : 0.0 },
          gradient: { type: "t", value: THREE.ImageUtils.loadTexture("./images/gradient_floor.png")}
        },
        vertexShader: require("./shaders/flag.vert.glsl"),
        fragmentShader: require("./shaders/flag.frag.glsl")
    });

    flagMaterial.side = THREE.DoubleSide;

    loadMesh('flag', function(mesh) {
        mesh.material = flagMaterial;

        for(var f = 0; f < 5; f++)
        {
            var radius = Math.random() * 30 + 10;
            var angle = Math.random() * Math.PI * 2;
            var flagPosition = new THREE.Vector3(Math.cos(angle) * radius, 0.0, Math.sin(angle) * radius)

            var flag = mesh.clone();
            flag.position.copy(flagPosition);
            flag.rotation.copy(new THREE.Euler(Math.random() * .2 - .1, Math.random() * Math.PI, Math.random() * .2 - .1));
            Engine.scene.add(flag);
        }
    });

    var cinematicElement = {
        time : 0.0,
        material : flagMaterial
    }

    return cinematicElement;
}

function loadAndDistributeWeapons()
{
    var weaponMaterial = new THREE.ShaderMaterial({
        vertexColors: THREE.VertexColors,
        uniforms: {
          time: { type: "f", value : 0.0 },
          gradient: { type: "t", value: THREE.ImageUtils.loadTexture("./images/gradient_floor.png")}
        },
        vertexShader: require("./shaders/weapons.vert.glsl"),
        fragmentShader: require("./shaders/weapons.frag.glsl")
    });

    var weaponNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14','15','16'];
    var originalWeapons = [];

    var loadedWeapons = 0;

    for(var w = 0; w < weaponNames.length; w++)
    {
        loadMesh('weapons/' + weaponNames[w], 
            function(mesh) {
                originalWeapons.push(mesh);
                mesh.material = weaponMaterial;

                loadedWeapons++;

                if(loadedWeapons == weaponNames.length)
                {
                    var clusters = 10;
                    var weaponsPerCluster = 10;

                    // Its a pity that I don't have much time, because these weapons could really use some blob shadows...
                    for(var c = 0; c < clusters; c++)
                    {
                        var radius = Math.random() * 10 + 18;
                        var angle = Math.random() * Math.PI * 1.6 + .2; // We need some space for the camera!
                        var clusterCenter = new THREE.Vector3(Math.sin(angle) * radius, 0.0, Math.cos(angle) * radius)

                        for(var i = 0; i < weaponsPerCluster; i++)
                        {
                            var randomWeaponIndex = Math.floor(Math.random() * originalWeapons.length);
                            var weapon = originalWeapons[randomWeaponIndex].clone();

                            var position = clusterCenter.clone().add(randomPoint(8.0));
                            position.y = Math.random() * 2 + 4;

                            var rotation = new THREE.Euler((Math.random() * 2.0 - 1.0) * .35,(Math.random() * 2.0 - 1.0) * .35, Math.PI + (Math.random() * 2.0 - 1.0) * .05);

                            var s = Math.random() * .5 + 1.5;
                            var scale = new THREE.Vector3(s,s,s);

                            weapon.position.copy(position);
                            weapon.rotation.copy(rotation);
                            weapon.scale.copy(scale);

                            Engine.scene.add(weapon);
                        }
                    }
                }
            });

    }

    var cinematicElement = {
        time : 0.0,
        material : weaponMaterial
    }

    return cinematicElement;
}

function loadBackground()
{   
    var floorMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: "f", value : 0.0 },
            gradientTexture: { type: "t", value: THREE.ImageUtils.loadTexture("./images/gradient_floor.png")}
        },
        vertexShader: require("./shaders/floor.vert.glsl"),
        fragmentShader: require("./shaders/floor.frag.glsl")
    });

    loadMesh('floor', function(mesh) {
        mesh.material = floorMaterial;
        Engine.scene.add(mesh);
    });

    var spotlightMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: "f", value : 0.0 },
            gradientTexture: { type: "t", value: THREE.ImageUtils.loadTexture("./images/spotlight_gradient.png")}
        },
        vertexShader: require("./shaders/spotlight.vert.glsl"),
        fragmentShader: require("./shaders/spotlight.frag.glsl")
    });

    spotlightMaterial.side = THREE.DoubleSide;
    makeMaterialAdditive(spotlightMaterial);

    loadMesh('spotlight', function(mesh) {
        mesh.material = spotlightMaterial;
        mesh.scale.set(4.5,2,4.5);
        mesh.position.set(0,-2,0);
        mesh.frustumCulled = false;
        Engine.scene.add(mesh);
    });

    var overlayMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
          vignette: { type: "t", value: THREE.ImageUtils.loadTexture("./images/vignette.png")}
        },
        vertexShader: require("./shaders/vignette.vert.glsl"),
        fragmentShader: require("./shaders/vignette.frag.glsl")
    });

    overlayMaterial.blending = THREE.CustomBlending;
    overlayMaterial.blendEquation = THREE.AddEquation;
    overlayMaterial.blendSrc = THREE.DstColorFactor;
    overlayMaterial.blendDst = THREE.SrcColorFactor;

    overlayMaterial.depthFunc = THREE.AlwaysDepth;
    overlayMaterial.depthWrite = false;
    overlayMaterial.depthTest = false;
    overlayMaterial.side = THREE.DoubleSide;
    overlayMaterial.transparent = true;
    overlayMaterial.renderOrder = 15;
    
    var overlayGeo = new THREE.PlaneGeometry( 1, 1, 1 );
    var overlay = new THREE.Mesh( overlayGeo, overlayMaterial );
    overlay.frustumCulled = false;
    Engine.scene.add( overlay );

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
    
    // The cinematic bars need to be transparent, else any transparent object will be on top of it
    cinematicBarsMaterial.transparent = true;
    cinematicBarsMaterial.blending = THREE.NoBlending;

    loadMesh('cinematic_bars', function(mesh) {
        mesh.material = cinematicBarsMaterial;
        mesh.renderOrder = 20; // This is the last thing rendered
        mesh.frustumCulled = false;
        Engine.scene.add(mesh);
    });

    var cinematicElement = {
        time : 0.0,
        material : spotlightMaterial,
        materials : [overlayMaterial]
    }

    var loaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
        },
        vertexShader: require("./shaders/cinematic_bars.vert.glsl"),
        fragmentShader: require("./shaders/cinematic_bars.frag.glsl")
    });

    loaderMaterial.depthFunc = THREE.AlwaysDepth;
    loaderMaterial.depthWrite = false;
    loaderMaterial.depthTest = false;
    loaderMaterial.side = THREE.DoubleSide;
    
    // The cinematic bars need to be transparent, else any transparent object will be on top of it
    loaderMaterial.transparent = true;
    loaderMaterial.blending = THREE.NoBlending;


    var loaderGeo = new THREE.PlaneGeometry(3, 3, 1 );
    Engine.loadingBlocker = new THREE.Mesh( loaderGeo, loaderMaterial );
    Engine.loadingBlocker.frustumCulled = false;
    Engine.loadingBlocker.renderOrder = 50;
    Engine.scene.add( Engine.loadingBlocker );


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
    var endCurve = GetWingEndCurve();

    var startParams = getStartCurveParameters();
    var endParams = getEndCurveParameters();

    var pointGeo = new THREE.Geometry();

    var accum = 0;
    var accumEnd = 0; 
    for(var i = 0; i < startParams.length; i++)
    {
        accum += startParams[i];
        accumEnd += endParams[i];

        pointGeo.vertices.push( curve.getPoint(accum).clone().add(new THREE.Vector3(0, 1, 0)) );
        pointGeo.vertices.push( endCurve.getPoint(accumEnd).clone().add(new THREE.Vector3(0, 1, 0)) );
    }

    var uSize = 50;
    var vSize = 50;
    for(var u = 0; u <= uSize; u++)
    {
        for(var v = 0; v <= vSize; v++)
        {
            var s = u / uSize;
            var t = v / vSize;

            pointGeo.vertices.push( evaluateCurveLoft(transversalCurves, s, t).clone().add(new THREE.Vector3(0, 1, 0)) );


        }
    }

    var pointMaterial = new THREE.PointsMaterial( { color: 0xff0000 } )
    pointMaterial.size = .2;
    var points = new THREE.Points( pointGeo, pointMaterial );
    Engine.scene.add( points );


    for(var i = 0; i < transversalCurves.length; i++)
    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = transversalCurves[i].getPoints(50);

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x0000ff } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }

    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = curve.getPoints( 50 );

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }

    {
        var curveGeo = new THREE.Geometry();
        curveGeo.vertices = endCurve.getPoints( 50 );

        var curveMaterial = new THREE.LineBasicMaterial( { color : 0x00ff00 } );
        var curveObject = new THREE.Line( curveGeo, curveMaterial );

        curveObject.position.set(0,1,0);
        Engine.scene.add(curveObject);
    }
}

function getStartCurveParameters()
{
    return [ .1, .15, .15, .3, .2, .5];
}

function getEndCurveParameters()
{
    return [ .05, .1, .08, .15, .23, .5];
}

// Find on which segment this t is found
function findSegmentIndex(t, parameterSubdivision)
{
    var x = t;
    var index = 0;
    var rawX = t;

    for(var i = 0; i < parameterSubdivision.length; i++)
    {
        if(x - parameterSubdivision[i] < 0)
        {
            index = i + 1;
            x = THREE.Math.clamp(x / parameterSubdivision[i], 0, 1);
            break;
        }
        else
        {
            x -= parameterSubdivision[i];
            rawX -= parameterSubdivision[i];
        }
    }

    return [index, x, rawX];
}

function accumulateParams(params, index)
{
    var r = 0;
    for(var i = 0; i < index; i++)
        r += params[i];

    return r;
}

function mirrorCurveLoft(x, mirror)
{
    if(mirror)
        x.x *= -1;
    return x;
}

// Essentially a Coons Patch
function evaluateCurveLoft(transversalCurves, u, v, mirror = false)
{
    u = THREE.Math.clamp(u, 0, 1);
    v = THREE.Math.clamp(v, 0, 1);

    var startCurve = GetWingConstructionCurve();
    var endCurve = GetWingEndCurve();

    var curveCount = transversalCurves.length;    
    var startParams = getStartCurveParameters();
    var endParams = getEndCurveParameters();

    var [startIndex, startT, rawStartT] = findSegmentIndex(u, startParams);
    var [endIndex, endT, rawEndT] = findSegmentIndex(u, endParams);

    var index = startIndex;

    if(endIndex > 0 && index > 0)
    {
        if(index >= transversalCurves.length)
        {
            return mirrorCurveLoft(transversalCurves[transversalCurves.length - 1].getPoint(v), mirror);
        }

        // Interpolating transversal curves
        var prevPoint = transversalCurves[index - 1].getPoint(v);
        var currentPoint = transversalCurves[index].getPoint(v);
        var Lu = prevPoint.lerp(currentPoint, 1.0 - startT);

        // Interpolating big curves
        var crossT = THREE.Math.clamp(accumulateParams(startParams, startIndex) + startParams[startIndex] * (1.0 - startT), 0, 1);
        var crossEndT = THREE.Math.clamp(accumulateParams(endParams, startIndex) + endParams[startIndex] * (1.0 - startT), 0, 1);

        var startPoint = startCurve.getPoint(crossT);
        var endPoint = endCurve.getPoint(crossEndT);
        var Lv = startPoint.lerp(endPoint, v);

        Lv.add(Lu);

        // Bilinear filtering of corners
        var b1 = transversalCurves[index - 1].getPoint(0);
        var b2 = transversalCurves[index].getPoint(0).lerp(b1, startT);

        var b3 = transversalCurves[index - 1].getPoint(1);
        var b4 = transversalCurves[index].getPoint(1).lerp(b3, startT);
        
        var B = b2.lerp(b4, v);

        B.negate();
        Lv.add(B);

        return mirrorCurveLoft(Lv, mirror);
    }

    return mirrorCurveLoft(transversalCurves[0].getPoint(v), mirror);
}

function makeMaterialAdditive(material)
{
    material.transparent = true;

    material.blending = THREE.CustomBlending;
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor;
    material.blendDst = THREE.OneFactor;

    material.depthTest = false;
    material.depthWrite = false;
}

function loadParticles()
{  
    // We're not in mobile, and we hate performance! :D
    var count = 1000;

    var particles = new THREE.Geometry();

    for(var p = 0; p < count; p++)
    {
        var pPosition = randomPoint(20);
        pPosition.y += 20; // No negative particles

        particles.vertices.push(pPosition);
    }

    var pMaterial = new THREE.PointsMaterial( { color: 0xffd55c, map :THREE.ImageUtils.loadTexture("./images/particle.png")} )
    pMaterial.transparent = true;

    makeMaterialAdditive(pMaterial);
    pMaterial.size = .1;
    var points = new THREE.Points( particles, pMaterial );
    points.onBeforeRender = function()
    {
        // Just snowfall particles here
        for(var p = 0; p < count; p++)
        {
            var vertex = particles.vertices[p];

            vertex.y -= .1 * Engine.deltaTime;
            vertex.x += Math.cos(Engine.time + vertex.z) * Engine.deltaTime * .2;
            vertex.z += Math.sin(Engine.time + vertex.x) * Engine.deltaTime * .2;

            // Toroidal everything
            if(vertex.y < 0)
                vertex.y = 40 - vertex.y;
        }

        particles.verticesNeedUpdate = true;
    };

    Engine.scene.add( points );

    var cinematicElement = {
        time : 0.0,
        materials : []
    }

    return cinematicElement;
}

function loadWings()
{
    var noiseTexture = THREE.ImageUtils.loadTexture("./images/noise.png");
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    var featherMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
          desintegrationFactor: { type: "f", value : 0.0 },
          gradient: { type: "t", value: THREE.ImageUtils.loadTexture("./images/gradient_wings.png")},
          noise: { type: "t", value: noiseTexture},
          lightLit: { type: "t", value: THREE.ImageUtils.loadTexture("./images/halo.png")},
        },
        vertexShader: require("./shaders/feather.vert.glsl"),
        fragmentShader: require("./shaders/feather.frag.glsl")
    });

    Engine.wingMaterial = featherMaterial;

    var cinematicElements = [];

    var curve = GetWingConstructionCurve();
    var transversalCurves = GetWingTransversalCurves();

    var feathers = []; 
    var container = new THREE.Object3D();
    var containerRight = new THREE.Object3D();
    container.position.set(0,.9,0);
    Engine.scene.add(container);
    Engine.scene.add(containerRight);

    // Feather roots 
    loadMesh('wing_start', function(mesh) {
        mesh.material = featherMaterial;

        var feathersToAdd = 75;

        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = i / feathersToAdd;

            var feather = mesh.clone();
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, 0 + Math.random() * .005);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .2)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( 2, 2, 1 );
            scale.add(randomPoint(.05));

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);    

            feather.matrixWorldNeedsUpdate = true;

            container.add(feather);
        }


        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = i / feathersToAdd;

            var feather = mesh.clone();
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, 0 + Math.random() * .005, true);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .2, true)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( 2, 2, 1 );
            scale.add(randomPoint(.05));

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);    

            feather.matrixWorldNeedsUpdate = true;

            containerRight.add(feather);
        }
    });

    // Feathers
    loadMesh('feather', function(mesh) {
        mesh.material = featherMaterial;

        var feathersToAdd = 75;

        // First, main feathers
        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = THREE.Math.clamp(i / feathersToAdd, 0, 1);

            var feather = mesh.clone();
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .05 + Math.random() * .02);
            position.y -= .1;
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .5)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .45 + (x * .25), 2, 1 );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.15 + Math.random() * .1);  
            feather.rotateZ(.2 + Math.random() * .05);

            feather.matrixWorldNeedsUpdate = true;

            // feather.userData = {
            //     originalMatrix : feather.matrix
            // }

            container.add(feather);
        }

        feathersToAdd = 100;

        // Secondary feathers
        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = Math.sqrt(THREE.Math.clamp(i / feathersToAdd, 0, 1));

            var feather = mesh.clone();
            feather.userData = { t : x };
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .05 + x * .05 + Math.random() * .05);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .7)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .65 + x * Math.random() * 1.5, 2, 2 );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.3 + Math.random() * .1);  
            feather.rotateZ(.2 + Math.random() * .05);
            feather.matrixWorldNeedsUpdate = true;

            container.add(feather);
        }
        
        feathersToAdd = 100;

        // Third row of feathers, biggest
        for(var i = 0; i < feathersToAdd; i++)
        {
            // We want more on the end
            var x = Math.sqrt(i / feathersToAdd);

            var feather = mesh.clone();
            feather.userData = { t : x };
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .3 + Math.random() * .05);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .9)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .5 + x * Math.random(), 2, 1.25 + Math.random() );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.15 + Math.random() * .1);  
            feather.rotateZ(.1 + Math.random() * .05);
            feather.matrixWorldNeedsUpdate = true;

            container.add(feather);
        }

        container.rotateX(Math.PI * -.23);
        container.rotateY(Math.PI);
        container.rotateZ(Math.PI * .65);
        container.position.set(.1,3.5,2);

        // -------------------------------------
        // RIGHT WING!! This can be optimized/fixed later, but time runs out!
        // First, main feathers
        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = THREE.Math.clamp(i / feathersToAdd, 0, 1);

            var feather = mesh.clone();
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .05 + Math.random() * .02, true);
            position.y -= .1;
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .5, true)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .45 + (x * .25), 2, 1 );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.15 + Math.random() * .1);  
            feather.rotateZ(.2 + Math.random() * .05);

            feather.matrixWorldNeedsUpdate = true;

            // feather.userData = {
            //     originalMatrix : feather.matrix
            // }

            containerRight.add(feather);
        }

        feathersToAdd = 100;

        // Secondary feathers
        for(var i = 0; i < feathersToAdd; i++)
        {
            var x = Math.sqrt(THREE.Math.clamp(i / feathersToAdd, 0, 1));

            var feather = mesh.clone();
            feather.userData = { t : x };
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .05 + x * .05 + Math.random() * .05, true);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .7, true)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .65 + x * Math.random() * 1.5, 2, 2 );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.3 + Math.random() * .1);  
            feather.rotateZ(.2 + Math.random() * .05);
            feather.matrixWorldNeedsUpdate = true;

            containerRight.add(feather);
        }
        
        feathersToAdd = 100;

        // Third row of feathers, biggest
        for(var i = 0; i < feathersToAdd; i++)
        {
            // We want more on the end
            var x = Math.sqrt(i / feathersToAdd);

            var feather = mesh.clone();
            feather.userData = { t : x };
            feathers.push(feather);

            var position = evaluateCurveLoft(transversalCurves, x, .3 + Math.random() * .05, true);
            position.add(randomPoint(.02));

            var target = evaluateCurveLoft(transversalCurves, x, .9, true)
            target.add(randomPoint(.02));

            var scale = new THREE.Vector3( .5 + x * Math.random(), 2, 1.25 + Math.random() );
            scale.add(randomPoint(.05));
            scale.multiplyScalar(1.5);

            feather.position.copy(position);
            feather.scale.copy(scale);
            feather.lookAt(target);
            feather.rotateY(3.14 * -.5);  
            feather.rotateX(.15 + Math.random() * .1);  
            feather.rotateZ(.1 + Math.random() * .05);
            feather.matrixWorldNeedsUpdate = true;

            containerRight.add(feather);
        }

        containerRight.rotateX(Math.PI * -.23);
        containerRight.rotateY(Math.PI);
        containerRight.rotateZ(Math.PI * -.6);
        containerRight.position.set(.1,3.5,2);

        container.updateMatrixWorld(true);
        containerRight.updateMatrixWorld(true);

        // A more complex method needs state checking... 
        var listener = new THREE.AudioListener();
        Engine.camera.add(listener);
        var sound = new THREE.Audio(listener);
        var audioLoader = new THREE.AudioLoader();

        //Load a sound and set it as the Audio object's buffer
        audioLoader.load('./sound/music.mp3', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop(true);
            sound.setVolume(1.0);
            sound.play();

            // Initialize the Engine ONLY when the sound is loaded
            Engine.initialized = true;
        });
    });

    var angelMaterial = new THREE.ShaderMaterial({
        vertexColors: THREE.VertexColors,
        uniforms: {
          time: { type: "f", value : 0.0 },
          gradient: { type: "t", value: THREE.ImageUtils.loadTexture("./images/gradient_floor.png")}
        },
        vertexShader: require("./shaders/angel.vert.glsl"),
        fragmentShader: require("./shaders/angel.frag.glsl")
    });

    loadMesh('angel', function(mesh) {
        mesh.material = angelMaterial;
        Engine.scene.add(mesh);

        cinematicElements.push({

        });
    });

    loadMesh('angel_sword', function(mesh) {
        mesh.material = angelMaterial;
        Engine.scene.add(mesh);

        cinematicElements.push({

        });
    });

    var energyTexture = THREE.ImageUtils.loadTexture("./images/energy.png")
    energyTexture.wrapS = energyTexture.wrapT = THREE.RepeatWrapping;

    var energyMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: "f", value : 0.0 },
            energyTexture: { type: "t", value: energyTexture}
        },
        vertexShader: require("./shaders/energy.vert.glsl"),
        fragmentShader: require("./shaders/energy.frag.glsl")
    });

    energyMaterial.blending = THREE.CustomBlending;
    energyMaterial.blendEquation = THREE.AddEquation;
    energyMaterial.blendSrc = THREE.OneFactor;
    energyMaterial.blendDst = THREE.OneFactor;
    energyMaterial.transparent = true;

    loadMesh('energy', function(mesh) {
        mesh.material = energyMaterial;
        mesh.scale.set(1.5,1,1.5);
        mesh.renderOrder = 2;

        Engine.scene.add(mesh);

        cinematicElements.push({
        });
    });

    var haloMaterial = new THREE.ShaderMaterial({
        vertexColors: THREE.VertexColors,
        uniforms: {
            time: { type: "f", value : 0.0 },
            sphereLit : { type: "t", value: THREE.ImageUtils.loadTexture("./images/halo.png")}
        },
        vertexShader: require("./shaders/halo.vert.glsl"),
        fragmentShader: require("./shaders/halo.frag.glsl")
    });

    var haloContainer = new THREE.Object3D();
    haloContainer.position.set(0, 3.41, 3.371);
    haloContainer.rotateX(Math.PI * 20 / 180);

    loadMesh('halo', function(mesh) {
        mesh.material = haloMaterial;
        haloContainer.add(mesh);

        var flare = new THREE.Geometry();
        flare.vertices.push(new THREE.Vector3(0,0,0));
        flare.vertices.push(new THREE.Vector3(0,0,0));

       
        var pMaterial = new THREE.PointsMaterial( { color: 0x554422, map :THREE.ImageUtils.loadTexture("./images/particle.png")} )
        pMaterial.transparent = true;
        pMaterial.side = THREE.DoubleSide;
        pMaterial.size = 3;
        
        makeMaterialAdditive(pMaterial);
        
        var points = new THREE.Points( flare, pMaterial );
        haloContainer.add( points );

        cinematicElements.push({
        });
    });

    Engine.scene.add(haloContainer);

    var firstTime = true;

    var cinematicElement = {
        time : 0.0,
        materials : [featherMaterial, energyMaterial, haloMaterial, angelMaterial],
        update : function() {

            if(Engine.initialized)
            {
                haloContainer.rotateY(.25 * Engine.deltaTime);

                if(firstTime && feathers.length > 300)
                {
                    firstTime = false;

                    for(var f = 0; f < feathers.length; f++)
                    {
                        var feather = feathers[f];
                        feather.updateMatrix();
                        feather.userData = { originalMatrix: feather.matrix.clone() };
                    }   
                }

                for(var f = 0; f < feathers.length; f++)
                {
                    // Some feather noise
                    var feather = feathers[f];

                    feather.position.set(0,0,0);
                    feather.rotation.set(0,0,0);
                    feather.scale.set(1,1,1);

                    // I hate you, threejs
                    feather.updateMatrix();
                    feather.applyMatrix(feather.userData.originalMatrix);
                    
                    feather.rotateY(Math.sin(Engine.time + feather.position.y * 6.0 + feather.position.x * 4.0) * .15);
                    feather.rotateX(Math.cos(Engine.time + feather.position.y * 6.0 + feather.position.z * 4.0) * .15);
                }
            }

        }
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

    camera.position.set(15, .5, 15);
    camera.lookAt(new THREE.Vector3(0,10,0));
    // camera.rotateZ(3.14 * -.5);

    LoadCinematicElement(loadWings);
    LoadCinematicElement(loadBackground);
    LoadCinematicElement(loadAndDistributeWeapons);
    LoadCinematicElement(loadFlags);
    LoadCinematicElement(loadParticles);


    Engine.cameraControllers.push(new CameraController(16, CameraShot.INTRO_D1, function(t) {
        var direction = new THREE.Vector3(0,-t * 4.0,t);
        var p = new THREE.Vector3(3, 5, 10).add(direction);
        Engine.camera.position.copy(p);

        Engine.camera.fov = 75;
        Engine.camera.lookAt(p.add(new THREE.Vector3(15, 3, 10)));
    }));

    Engine.cameraControllers.push(new CameraController(16, CameraShot.INTRO_D2, function(t) {            
        var direction = new THREE.Vector3(0,t * 2.0, t*10);
        var p = new THREE.Vector3(-5, 10, -5).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(p.add(direction.negate()));
    }));

    Engine.cameraControllers.push(new CameraController(15, CameraShot.INTRO_D3, function(t) {            
        var direction = new THREE.Vector3(.5,t,-t * 10.0);
        var p = new THREE.Vector3(-6, 3, 10).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(p.add(new THREE.Vector3(0,-1,2)));
    }));

    Engine.cameraControllers.push(new CameraController(46, CameraShot.INTRO_D4, function(t) {            
        var direction = new THREE.Vector3(.5,t,-t * 14.0);
        var p = new THREE.Vector3(0, 2, 23).add(direction);

        Engine.camera.fov = 75;
        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,3 + t * 9.5,0));
    }, function() {
        Engine.time = 0; // This will restart vignette ;)
    }));

    Engine.cameraControllers.push(new CameraController(16, CameraShot.MAIN_D1, function(t) {            
        var direction = new THREE.Vector3(.5,-t * 10.0,0.0);
        var p = new THREE.Vector3(8, 15, 8).add(direction);

        Engine.camera.fov = 80;
        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,3 + t * 10,0));
    }));

    Engine.cameraControllers.push(new CameraController(15, CameraShot.MAIN_D1, function(t) {            
        var direction = new THREE.Vector3(.5,-t * 10.0,0.0);
        var p = new THREE.Vector3(0, 30, .5).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,0,0));
        Engine.camera.rotateZ(t);
    }));

    Engine.cameraControllers.push(new CameraController(18, CameraShot.INTRO_D2, function(t) {            
        var direction = new THREE.Vector3(0,Math.cos(t) * 5,Math.sin(t) * 10);
        var p = new THREE.Vector3(3, 10, 10).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,1, 2));
    }));

    Engine.cameraControllers.push(new CameraController(32, CameraShot.INTRO_D2, function(t) {            
        var direction = new THREE.Vector3(0,Math.cos(t) * 2,Math.sin(t) * 3);
        var p = new THREE.Vector3(15, 3, 15).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,1 + t * 10.0, 2));

        if(Engine.desintegrate)
            Engine.desintegrationFactor = t * .3;
    }));

    Engine.cameraControllers.push(new CameraController(15, CameraShot.MAIN_D1, function(t) {            
        var direction = new THREE.Vector3(.5,t * 10.0,0.0);
        var p = new THREE.Vector3(0, 20, .5).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,0,0));
        Engine.camera.rotateZ(t);

        if(Engine.desintegrate)
            Engine.desintegrationFactor = .6;

    }, function() {
        Engine.time = 0;
    }));

    Engine.cameraControllers.push(new CameraController(16, CameraShot.INTRO_D2, function(t) {            
        var direction = new THREE.Vector3(0,Math.cos(t) * 2,Math.sin(t) * 3);
        var p = new THREE.Vector3(5, 3, 12).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,1 + t * 10.0, 2));

        if(Engine.desintegrate)
            Engine.desintegrationFactor = .6 + t * .1;
    }));

    Engine.cameraControllers.push(new CameraController(16, CameraShot.INTRO_D2, function(t) {        
        Engine.desintegrate = false;

        var direction = new THREE.Vector3(Math.cos(t) * 3, 10 * t, Math.sin(t) * 3);
        var p = new THREE.Vector3(5, 3, 5).add(direction);

        Engine.camera.position.copy(p);
        Engine.camera.lookAt(new THREE.Vector3(0,p.y, 0));
    }, function() {}, function() {
        setActiveCamera(2);
    }));

    // Uncomment this line if you want to see the surface patch!
    // loadWingConstructionCurves();

    setActiveCamera(0);
}

class CameraController {
    constructor(duration, state, func, startFunc = null, onExitFunc = null,) {
        this.func = func;
        this.time = 0;
        this.duration = duration;
        this.state = state;
        this.startFunc = startFunc;
        this.onExitFunc = onExitFunc;
    }

    setActive()
    {
        if(this.startFunc != null)
            this.startFunc();
        
        // This must be after the callback, because controllers may reset the time ;)
        this.time = Engine.cameraTime;
    }

    update()
    {
        var t = THREE.Math.clamp((Engine.cameraTime - this.time) / this.duration, 0.0, 1.0);
        this.func(t);    
        return t >= 1;
    }

    onExit()
    {
        if(this.onExitFunc != null)
            this.onExitFunc();
    }
}

function updateCamera()
{
    if(Engine.currentCameraIndex < Engine.cameraControllers.length)
    {
        var controller = Engine.cameraControllers[Engine.currentCameraIndex];
        var next = controller.update();

        if(next)
        {
            controller.onExit();
            setActiveCamera(Engine.currentCameraIndex + 1);
        }
    }
}

function setActiveCamera(index)
{
    Engine.currentCameraIndex = index;

    if(Engine.currentCameraIndex < Engine.cameraControllers.length)
        Engine.cameraControllers[Engine.currentCameraIndex].setActive();
}

function onUpdate(framework) 
{
    if(Engine.initialized)
    {
        Engine.loadingBlocker.visible = false;
        var screenSize = new THREE.Vector2( framework.renderer.getSize().width, framework.renderer.getSize().height );
        var deltaTime = Engine.clock.getDelta();

        Engine.wingMaterial.uniforms.desintegrationFactor.value = Engine.desintegrationFactor;

        Engine.time += deltaTime;
        Engine.cameraTime += deltaTime;
        Engine.deltaTime = deltaTime;
        for(var c = 0; c < Engine.cinematicElements.length; c++)
        {
            if(Engine.cinematicElements[c].update != null)
                Engine.cinematicElements[c].update();
        }

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

        updateCamera();

        Engine.camera.updateProjectionMatrix();
    }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);