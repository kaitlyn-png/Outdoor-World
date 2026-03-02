// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform bool u_lightOn;
  uniform bool u_nightMode;
  uniform bool u_spotOn;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform vec3 u_LightPosition;
  uniform vec3 u_SunLightColor;
  uniform vec3 u_cameraPosition;
  uniform vec3 u_SpotPosition;
  uniform vec3 u_SpotDirection;
  uniform float u_SpotCutoffCos;
  uniform float u_SpotIntensity;
  uniform int u_whichTexture;
  uniform bool u_lightOn;
  uniform bool u_nightMode;
  uniform bool u_spotOn;
  void main() {
    if (u_whichTexture == -4) {
      gl_FragColor = u_FragColor; // color
      return;
    } else if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0); // use normal as color
      return;
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; // use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0); // use UV as color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); // use texture0
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); // use texture1
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV); // use texture2
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV); // use texture3
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV); // use texture4
    } else {
      gl_FragColor = vec4(1, 0.2, 0.2, 1); // error
    }

    if (!u_lightOn) {
      gl_FragColor = vec4(gl_FragColor.rgb, gl_FragColor.a);
      return;
    }

    vec3 lightVector = u_LightPosition - vec3(v_VertPos);
    float r = length(lightVector);

    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    if (u_whichTexture == 0 || u_whichTexture == 1) {
      N = -N;
    }
    float nDotL = max(dot(N, L), 0.0);

    vec3 E = normalize(u_cameraPosition - vec3(v_VertPos));
    vec3 H = normalize(L + E);

    float sunIntensity = u_nightMode ? 0.25 : 1.2;
    float ambientStrength = u_nightMode ? 0.12 : 0.24;

    float attenuation = 1.0 / (1.0 + 0.008 * r + 0.0012 * r * r);
    vec3 diffuse = u_SunLightColor * gl_FragColor.rgb * nDotL * 1.05 * attenuation * sunIntensity;
    vec3 ambient = gl_FragColor.rgb * ambientStrength;

    float specularStrength = (u_whichTexture >= 0) ? 0.4: 0.2;
    float specular = pow(max(dot(N, H), 0.0), 30.0) * specularStrength * nDotL * attenuation * sunIntensity;

    if (u_spotOn) {
      vec3 spotToFrag = vec3(v_VertPos) - u_SpotPosition;
      float spotDist = length(spotToFrag);
      vec3 spotDirToFrag = normalize(spotToFrag);
      float spotCos = dot(spotDirToFrag, normalize(u_SpotDirection));
      if (spotCos > u_SpotCutoffCos) {
        vec3 Ls = normalize(u_SpotPosition - vec3(v_VertPos));
        float spotNDotL = max(dot(N, Ls), 0.0);
        float spotAtt = (spotCos - u_SpotCutoffCos) / (1.0 - u_SpotCutoffCos);
        spotAtt = spotAtt * spotAtt;
        spotAtt = spotAtt / (1.0 + 0.01 * spotDist + 0.002 * spotDist * spotDist);

        vec3 Hs = normalize(Ls + E);
        float spotSpec = pow(max(dot(N, Hs), 0.0), 32.0) * 0.70 * spotNDotL * spotAtt * u_SpotIntensity;
        vec3 spotDiffuse = vec3(1.0, 0.95, 0.80) * gl_FragColor.rgb * spotNDotL * 2.40 * spotAtt * u_SpotIntensity;

        diffuse += spotDiffuse;
        specular += spotSpec;
      }
    }

    gl_FragColor = vec4(ambient + diffuse + vec3(specular), gl_FragColor.a);
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_LightPosition;
let u_SunLightColor;
let u_cameraPosition;
let u_SpotPosition;
let u_SpotDirection;
let u_SpotCutoffCos;
let u_SpotIntensity;
let u_ProjectionMatrix;
let u_ModelMatrix;
let u_NormalMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_lightOn;
let u_nightMode;
let u_spotOn;

// Texture variables
let g_texture0;
let g_texture1;
let g_texture2;
let g_texture3;
let g_texture4;
const MAP_SIZE = 32;
const SUN_RADIUS = 1;
const LAMP_BULB_POS = [1.7, 15.3, 2.0];
const LAMP_SPOT_DIR = [0.0, -1.0, 0.0];
const LAMP_SPOT_CUTOFF_COS = Math.cos(22.0 * Math.PI / 180.0);

// Camera variables
let g_camera;

// Normal visualization toggle
let g_normalOn = false;

// Light position
let g_lightPosition = [0, MAP_SIZE / 2 + 9, 0];

// Light toggle
let g_lightOn = true;
let g_spotOn = false;
let g_nightMode = false;
let g_redSun = false;
let g_sunColor = [1.0, 1.0, 1.0];

// ROTATING VARIABLES
let g_pointerLocked = false;
let g_pointerLockInFlight = false;

// Orbit variables
let g_orbitOn = false;
let g_orbitCenter = [0, MAP_SIZE / 2, 0];
let g_orbitRadius = MAP_SIZE * 0.35;
let g_orbitSpeed = 0.8;
let g_orbitYAmp = 1.5;

// Light slider references
let g_lightSliderX;
let g_lightSliderY;
let g_lightSliderZ;
let g_sunColorSliderR;
let g_sunColorSliderG;
let g_sunColorSliderB;

// Load Object file
let lamp = null;

function clampLightPosition() {
  var half = MAP_SIZE / 2;
  var minX = -half + SUN_RADIUS;
  var maxX = half - SUN_RADIUS;
  var minY = SUN_RADIUS;
  var maxY = MAP_SIZE - SUN_RADIUS;
  var minZ = -half + SUN_RADIUS;
  var maxZ = half - SUN_RADIUS;

  g_lightPosition[0] = Math.max(minX, Math.min(maxX, g_lightPosition[0]));
  g_lightPosition[1] = Math.max(minY, Math.min(maxY, g_lightPosition[1]));
  g_lightPosition[2] = Math.max(minZ, Math.min(maxZ, g_lightPosition[2]));
}

function setLightSlidersDisabled(disabled) {
  if (g_lightSliderX) g_lightSliderX.disabled = disabled;
  if (g_lightSliderY) g_lightSliderY.disabled = disabled;
  if (g_lightSliderZ) g_lightSliderZ.disabled = disabled;
}

function syncLightSlidersToPosition() {
  if (g_lightSliderX) g_lightSliderX.value = g_lightPosition[0] * 100;
  if (g_lightSliderY) g_lightSliderY.value = g_lightPosition[1] * 100;
  if (g_lightSliderZ) g_lightSliderZ.value = g_lightPosition[2] * 100;
}

function resizeCanvasToDisplaySize() {
  if (!canvas) return;

  var dpr = window.devicePixelRatio || 1;
  var displayWidth = Math.floor(window.innerWidth * dpr);
  var displayHeight = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  if (g_camera) {
    g_camera.updateMatrices();
  }
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  resizeCanvasToDisplaySize();

  window.addEventListener('resize', function() {
    resizeCanvasToDisplaySize();
    renderScene();
  });

  // Mouse functions
  canvas.oncontextmenu = function(ev) { ev.preventDefault(); };
  canvas.onmousedown = onMouseDown;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  
  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  } 

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program,'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  } 

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  } 
  
  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program,'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program,'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program,'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program,'u_whichTexture');

  // Get the storage location of u_LightPosition
  u_LightPosition = gl.getUniformLocation(gl.program,'u_LightPosition');
  if (!u_LightPosition) {
    console.log('Failed to get the storage location of u_LightPosition');
    return;
  }

  // Get the storage location of u_SunLightColor
  u_SunLightColor = gl.getUniformLocation(gl.program,'u_SunLightColor');
  if (!u_SunLightColor) {
    console.log('Failed to get the storage location of u_SunLightColor');
    return;
  }

  // Get the storage location of u_cameraPosition
  u_cameraPosition = gl.getUniformLocation(gl.program, 'u_cameraPosition');
  if (!u_cameraPosition) {
    console.log('Failed to get the storage location of u_cameraPosition');
    return;
  }

  // Get the storage location of spotlight uniforms
  u_SpotPosition = gl.getUniformLocation(gl.program, 'u_SpotPosition');
  if (!u_SpotPosition) {
    console.log('Failed to get the storage location of u_SpotPosition');
    return;
  }

  u_SpotDirection = gl.getUniformLocation(gl.program, 'u_SpotDirection');
  if (!u_SpotDirection) {
    console.log('Failed to get the storage location of u_SpotDirection');
    return;
  }

  u_SpotCutoffCos = gl.getUniformLocation(gl.program, 'u_SpotCutoffCos');
  if (!u_SpotCutoffCos) {
    console.log('Failed to get the storage location of u_SpotCutoffCos');
    return;
  }

  u_SpotIntensity = gl.getUniformLocation(gl.program, 'u_SpotIntensity');
  if (!u_SpotIntensity) {
    console.log('Failed to get the storage location of u_SpotIntensity');
    return;
  }

  // Get the storage location of u_lightOn
  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  // Get the storage location of u_nightMode
  u_nightMode = gl.getUniformLocation(gl.program, 'u_nightMode');
  if (!u_nightMode) {
    console.log('Failed to get the storage location of u_nightMode');
    return;
  }

  // Get the storage location of u_spotOn
  u_spotOn = gl.getUniformLocation(gl.program, 'u_spotOn');
  if (!u_spotOn) {
    console.log('Failed to get the storage location of u_spotOn');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program,'u_Sampler0');

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program,'u_Sampler1');

  // Get the storage location of u_Sampler2
  u_Sampler2 = gl.getUniformLocation(gl.program,'u_Sampler2');

  // Get the storage location of u_Sampler3
  u_Sampler3 = gl.getUniformLocation(gl.program,'u_Sampler3');

  // Get the storage location of u_Sampler4
  u_Sampler4 = gl.getUniformLocation(gl.program,'u_Sampler4');

  // Set an inital value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
}

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // Button events
  document.getElementById('normal').onclick = function () { g_normalOn = !g_normalOn; addClassToElement(); renderScene(); };
  document.getElementById('orbit').onclick = function () {
    addClassToElement();
    if (g_orbitOn) {
      g_orbitOn = false;
    } else {
      g_orbitOn = true;
      g_lightPosition[0] = g_orbitCenter[0];
      g_lightPosition[1] = g_orbitCenter[1];
      g_lightPosition[2] = g_orbitCenter[2];
      clampLightPosition();
      syncLightSlidersToPosition();
    }
    setLightSlidersDisabled(g_orbitOn);
    if (!g_orbitOn) {
      syncLightSlidersToPosition();
    }
    renderScene();
  };

  document.getElementById('light').onclick = function () { g_lightOn = !g_lightOn; addClassToElement();renderScene(); };
  document.getElementById('spot').onclick = function () { g_spotOn = !g_spotOn; addClassToElement(); renderScene(); };
  document.getElementById('nightMode').onclick = function () { g_nightMode = !g_nightMode; addClassToElement(); renderScene(); };
  document.getElementById('redSun').onclick = function () {
    g_redSun = !g_redSun;

    if (g_redSun) {
      g_sunColor[0] = 1;
      g_sunColor[1] = 0;
      g_sunColor[2] = 0;

      if (g_sunColorSliderR) g_sunColorSliderR.value = g_sunColor[0] * 100;
      if (g_sunColorSliderG) g_sunColorSliderG.value = g_sunColor[1] * 100;
      if (g_sunColorSliderB) g_sunColorSliderB.value = g_sunColor[2] * 100;
    } else {
      g_sunColor[0] = 1;
      g_sunColor[1] = 1;
      g_sunColor[2] = 1;

      if (g_sunColorSliderR) g_sunColorSliderR.value = g_sunColor[0] * 100;
      if (g_sunColorSliderG) g_sunColorSliderG.value = g_sunColor[1] * 100;
      if (g_sunColorSliderB) g_sunColorSliderB.value = g_sunColor[2] * 100;
    }

    addClassToElement();
    renderScene();
  };

  var sliderX = document.getElementById('lightSliderX');
  var sliderY = document.getElementById('lightSliderY');
  var sliderZ = document.getElementById('lightSliderZ');
  var sunSliderR = document.getElementById('sunColorSliderR');
  var sunSliderG = document.getElementById('sunColorSliderG');
  var sunSliderB = document.getElementById('sunColorSliderB');
  g_lightSliderX = sliderX;
  g_lightSliderY = sliderY;
  g_lightSliderZ = sliderZ;
  g_sunColorSliderR = sunSliderR;
  g_sunColorSliderG = sunSliderG;
  g_sunColorSliderB = sunSliderB;

  var half = MAP_SIZE / 2;
  var minX = -half + SUN_RADIUS;
  var maxX = half - SUN_RADIUS;
  var minY = SUN_RADIUS;
  var maxY = MAP_SIZE - SUN_RADIUS;
  var minZ = -half + SUN_RADIUS;
  var maxZ = half - SUN_RADIUS;

  sliderX.min = minX * 100;
  sliderX.max = maxX * 100;
  sliderY.min = minY * 100;
  sliderY.max = maxY * 100;
  sliderZ.min = minZ * 100;
  sliderZ.max = maxZ * 100;
  sunSliderR.value = g_sunColor[0] * 100;
  sunSliderG.value = g_sunColor[1] * 100;
  sunSliderB.value = g_sunColor[2] * 100;

  clampLightPosition();
  syncLightSlidersToPosition();

  setLightSlidersDisabled(g_orbitOn);

  // Slider events
  sliderX.addEventListener('input', function() {
    g_lightPosition[0] = this.value / 100;
    clampLightPosition();
    renderScene();
  });
  sliderY.addEventListener('input', function() {
    g_lightPosition[1] = this.value / 100;
    clampLightPosition();
    renderScene();
  });
  sliderZ.addEventListener('input', function() {
    g_lightPosition[2] = this.value / 100;
    clampLightPosition();
    renderScene();
  });

  function onSunColorSliderInput() {
    g_sunColor[0] = sunSliderR.value / 100;
    g_sunColor[1] = sunSliderG.value / 100;
    g_sunColor[2] = sunSliderB.value / 100;
    if (g_redSun) {
      g_redSun = false;
      var redSunButton = document.getElementById('redSun');
      if (redSunButton) {
        redSunButton.classList.remove('selected');
      }
    }
    renderScene();
  }

  sunSliderR.addEventListener('input', onSunColorSliderInput);
  sunSliderG.addEventListener('input', onSunColorSliderInput);
  sunSliderB.addEventListener('input', onSunColorSliderInput);
}

addClassToElement = function() {
  var normalButton = document.getElementById('normal');
  if (g_normalOn) {
    normalButton.classList.add('selected');
  } else {
    normalButton.classList.remove('selected');
  }
  var orbitButton = document.getElementById('orbit');
  if (g_orbitOn) {
    orbitButton.classList.add('selected');
  } else {
    orbitButton.classList.remove('selected');
  }
  var lightButton = document.getElementById('light');
  if (g_lightOn) {
    lightButton.classList.add('selected');
  } else {
    lightButton.classList.remove('selected');
  }
  var spotButton = document.getElementById('spot');
  if (g_spotOn) {
    spotButton.classList.add('selected');
  } else {
    spotButton.classList.remove('selected');
  }
  var nightModeButton = document.getElementById('nightMode');
  if (g_nightMode) {
    nightModeButton.classList.add('selected');
  } else {
    nightModeButton.classList.remove('selected');
  }
  var redSunButton = document.getElementById('redSun');
  if (g_redSun) {
    redSunButton.classList.add('selected');
  } else {
    redSunButton.classList.remove('selected');
  }
};

function initTextures(){
  loadTexture('textures/sky-1.jpg', 0);
  loadTexture('textures/grass.png', 1);
  loadTexture('textures/basketball.jpg', 2);
  loadTexture('textures/soccer.jpg', 3);
  loadTexture('textures/tennis.jpg', 4);
  return true;
}

function loadTexture(src, textureUnit) {
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  image.onload = function(){ sendTexturetoGLSL(image, textureUnit, src); };
  image.onerror = function(){ 
    console.log('Failed to load texture image: ' + src);
    console.log('Make sure you are running a web server');
  };
  image.src = src;
  return true;
}

function sendTexturetoGLSL(image, textureUnit, src) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  if (textureUnit === 0) {
    g_texture0 = texture;
  } else if (textureUnit === 1) {
    g_texture1 = texture;
  } else if (textureUnit === 2) {
    g_texture2 = texture;
  } else if (textureUnit === 3) {
    g_texture3 = texture;
  } else if (textureUnit === 4) {
    g_texture4 = texture;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (textureUnit === 0) {
    gl.uniform1i(u_Sampler0, 0);
  } else if (textureUnit === 1) {
    gl.uniform1i(u_Sampler1, 1);
  } else if (textureUnit === 2) {
    gl.uniform1i(u_Sampler2, 2);
  } else if (textureUnit === 3) {
    gl.uniform1i(u_Sampler3, 3);
  } else if (textureUnit === 4) {
    gl.uniform1i(u_Sampler4, 4);
  }

  console.log('Texture loaded successfully', src, image.width + 'x' + image.height);
}

// Main Function
function main() {

  // Set up Canvas and WebGL context
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Initialize camera
  g_camera = new Camera();

  // Set camera bounds to stay within the map
  var padding = 0.5;
  var half = MAP_SIZE / 2;
  g_camera.setBounds(
    -half + padding,
    half - padding,
    padding,
    half - padding,
    -half + padding,
    half - padding
  );

  document.onkeydown = keydown;

  initTextures();

  lamp = new Model(gl, 'obj/street-lamp/Street%20Lamp.obj');

  // Color to clear <canvas>
  gl.clearColor(0.741, 0.901, 0.950, 1.0); // background color
  gl.clearDepth(1.0);

  //renderScene();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

// Called by browser repeatedly whenver its time
function tick(){
  // Save current time
  g_seconds = performance.now()/1000.0 - g_startTime;

  // Update animations based on time
  updateAnimationAngles();

  // Draw everything
  renderScene();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_orbitOn) {
    const t = g_seconds;
    g_lightPosition[0] = g_orbitCenter[0] + g_orbitRadius * Math.cos(g_orbitSpeed * t);
    g_lightPosition[2] = g_orbitCenter[2] + g_orbitRadius * Math.sin(g_orbitSpeed * t);
    g_lightPosition[1] = g_orbitCenter[1] + g_orbitYAmp * Math.sin(0.5 * g_orbitSpeed * t);
    clampLightPosition();
    syncLightSlidersToPosition();
  }
}

function onMouseDown(ev) {
  if (ev.button !== 0) return;
  lockPointer();
}

function onMouseMove(ev) {
  // Pointer lock controls for camera position
  if (g_camera && g_pointerLocked) {
    let dx = ev.movementX || 0;
    let dy = ev.movementY || 0;
    g_camera.look(dx, dy);
  }
}

function lockPointer() {
  if (!canvas) return;
  if (document.pointerLockElement === canvas || g_pointerLockInFlight) return;

  g_pointerLockInFlight = true;
  try {
    const lockResult = canvas.requestPointerLock();
    if (lockResult && typeof lockResult.then === 'function') {
      lockResult
        .catch(function() {
        })
        .finally(function() {
          g_pointerLockInFlight = false;
        });
    } else {
      g_pointerLockInFlight = false;
    }
  } catch (e) {
    g_pointerLockInFlight = false;
  }
}

function onPointerLockChange() {
  g_pointerLocked = (document.pointerLockElement === canvas);
  if (g_pointerLocked) {
    g_pointerLockInFlight = false;
  }
}

function keydown(ev) {
  if (!g_camera) return;

  if (ev.keyCode == 32) { // Space
    ev.preventDefault();
    g_camera.moveUp();
  } else if (ev.keyCode == 16) { // Shift
    g_camera.moveDown();
  }

  if (ev.keyCode == 87) { // W
    g_camera.moveForward();
  } else if (ev.keyCode == 83) { // S
    g_camera.moveBackward();
  } else if (ev.keyCode == 65) { // A
    g_camera.moveLeft();
  } else if (ev.keyCode == 68) { // D
    g_camera.moveRight();
  } else if (ev.keyCode == 81) { // Q
    g_camera.turnLeft();
  } else if (ev.keyCode == 69) { // E
    g_camera.turnRight();
  }

  renderScene();
}

function renderScene(){
  clampLightPosition();

  // Pass the projection matrix from camera
  var projMat = g_camera ? g_camera.getProjectionMatrix() : new Matrix4();
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Pass the view matrix
  var viewMat = g_camera ? g_camera.getViewMatrix() : new Matrix4();
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the global rotation matrix
  var globalRotMat = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Bind texture if loaded
  if (g_texture0) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g_texture0);
  }
  if (g_texture1) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, g_texture1);
  }
  if (g_texture2) {
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, g_texture2);
  }

  var activeSunColor = g_nightMode
    ? [1.0, 1.0, 1.0]
    : (g_redSun ? [1.0, 0.2, 0.2] : g_sunColor);

  // Pass light position
  gl.uniform3f(u_LightPosition, g_lightPosition[0], g_lightPosition[1], g_lightPosition[2]);
  gl.uniform3f(u_SunLightColor, activeSunColor[0], activeSunColor[1], activeSunColor[2]);

  // Pass camera position
  gl.uniform3f(u_cameraPosition, g_camera.eye[0], g_camera.eye[1], g_camera.eye[2]);

  // Pass the lightOn uniform
  gl.uniform1i(u_lightOn, g_lightOn);
  gl.uniform1i(u_nightMode, g_nightMode ? 1 : 0);

  // Pass spotlight uniforms
  gl.uniform1i(u_spotOn, g_spotOn ? 1 : 0);
  gl.uniform3f(u_SpotPosition, LAMP_BULB_POS[0], LAMP_BULB_POS[1], LAMP_BULB_POS[2]);
  gl.uniform3f(u_SpotDirection, LAMP_SPOT_DIR[0], LAMP_SPOT_DIR[1], LAMP_SPOT_DIR[2]);
  gl.uniform1f(u_SpotCutoffCos, LAMP_SPOT_CUTOFF_COS);
  gl.uniform1f(u_SpotIntensity, g_spotOn ? 1.1 : 0.0);

  // Draw the sky
  var sky = new Cube();
  sky.color = [0.679, 0.863, 0.930, 1.0];
  if (g_normalOn) {
    sky.textureNum = -3;
    sky.bottomTextureNum = null;
  } else if (!g_texture0 || !g_texture1) {
    sky.textureNum = -2;
    sky.bottomTextureNum = null;
  } else {
    sky.textureNum = 0;
    sky.bottomTextureNum = 1;
  }
  sky.matrix.scale(MAP_SIZE, MAP_SIZE, MAP_SIZE);
  sky.matrix.translate(-0.5, 0, -0.5);
  sky.render();

  // Draw the sun with light
  var sun = new Sphere();
  sun.color = [activeSunColor[0], activeSunColor[1], activeSunColor[2], 1.0];
  if (g_normalOn) {
    sun.textureNum = -3;
  } else {
    sun.textureNum = -4;
  }
  sun.matrix.translate(g_lightPosition[0], g_lightPosition[1], g_lightPosition[2]);
  sun.matrix.scale(SUN_RADIUS, SUN_RADIUS, SUN_RADIUS);
  sun.normalMatrix.setInverseOf(sun.matrix).transpose();
  sun.render();

  // Draw a basketball 
  var basketball = new Sphere();
  basketball.color = [1.0, 0.5, 0.0, 1.0];
  if (g_normalOn) {
    basketball.textureNum = -3;
  } else {
    basketball.textureNum = 2;
  }
  basketball.matrix.translate(5, 0.99, 5);
  basketball.matrix.scale(1, 1, 1);
  basketball.normalMatrix.setInverseOf(basketball.matrix).transpose();
  basketball.render();

  // Draw a soccer ball
  var soccerBall = new Sphere();
  soccerBall.color = [1.0, 1.0, 1.0, 1.0];
  if (g_normalOn) {
    soccerBall.textureNum = -3;
  } else {
    soccerBall.textureNum = 3;
  }
  soccerBall.matrix.translate(-1, 0.99, 1);
  soccerBall.matrix.scale(1, 1, 1);
  soccerBall.normalMatrix.setInverseOf(soccerBall.matrix).transpose();
  soccerBall.render();

  // Draw a tennis ball
  var tennisBall = new Sphere();
  tennisBall.color = [1.0, 1.0, 0.5, 1.0];
  if (g_normalOn) {
    tennisBall.textureNum = -3;
  } else {
    tennisBall.textureNum = 4;
  } 
  tennisBall.matrix.translate(1, 0.4, 3);
  tennisBall.matrix.scale(0.4, 0.4, 0.4);
  tennisBall.normalMatrix.setInverseOf(tennisBall.matrix).transpose();
  tennisBall.render();

  // render obj
  if (lamp) {
    lamp.color = [0.650, 0.656, 0.656, 1.0];
    if (g_normalOn) {
      lamp.textureNum = -3;
    } else {
      lamp.textureNum = -2;
    }
    lamp.matrix.setIdentity();
    lamp.matrix.translate(-1, 0, 2);
    lamp.matrix.scale(0.01, 0.01, 0.01);
    lamp.matrix.translate(-148.335541, 438.868408, 0.021357);
    lamp.matrix.rotate(0, 0, 1, 0);
    lamp.render(gl, {
      a_Position: a_Position,
      a_Normal: a_Normal,
      u_ModelMatrix: u_ModelMatrix,
      u_FragColor: u_FragColor,
      u_NormalMatrix: u_NormalMatrix,
      u_whichTexture: u_whichTexture
    });
  }

  // lamp bulb sphere
  var lampBulb = new Sphere();
  lampBulb.color = g_spotOn ? [1.0, 0.95, 0.75, 1.0] : [0.45, 0.42, 0.35, 1.0];
  lampBulb.textureNum = g_normalOn ? -3 : -4;
  lampBulb.matrix.translate(LAMP_BULB_POS[0], LAMP_BULB_POS[1], LAMP_BULB_POS[2]);
  lampBulb.matrix.scale(0.3, 0.3, 0.3);
  lampBulb.normalMatrix.setInverseOf(lampBulb.matrix).transpose();
  lampBulb.render();
}
