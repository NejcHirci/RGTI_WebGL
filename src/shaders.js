const vertex = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uViewModel;
uniform mat4 uProjection;
uniform vec3 uLightPosition;

out vec3 vLight;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vec3 vertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    vec3 lightPosition = (uViewModel * vec4(uLightPosition, 1)).xyz;
    vLight = lightPosition - vertexPosition;
    
    
    vNormal = (uViewModel * vec4(aNormal, 0)).xyz;
    
    if (length(aNormal) == 0.0) {
        vNormal = vLight;    
    }
    vTexCoord = aTexCoord;

    gl_Position = uProjection * vec4(vertexPosition, 1);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform mediump sampler2D uTexture;

uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

in vec3 vLight;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vLight);
    
    
    float diff = max(0.0, dot(L, N));
    diff = smoothstep(0.0, 1.0, diff);
    diff = floor(diff * 7.0) / 7.0;
    vec3 diffuse = diff * uDiffuseColor;
    
    float ambientStrength = 0.8;
    vec3 ambient = ambientStrength * uAmbientColor;
    vec3 light = (ambient + diffuse);
    

    oColor = texture(uTexture, vTexCoord) * vec4(light, 1);
}
`;

const vertexGltf = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;


uniform mat4 uViewModel;
uniform mat4 uProjection;

out vec2 vTexCoord;

void main() {
    vec3 vertexPosition = (uViewModel * vec4(aPosition)).xyz;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * vec4(vertexPosition, 1);
}
`;

const fragmentGltf = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
    oColor.rgb *= 1.1;
}
`;

const skyboxV = `#version 300 es
layout (location = 0) in vec4 aPosition;

out vec4 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = aPosition;
    gl_Position.z = 1.0;
}
`;

const skyboxF = `#version 300 es
precision highp float;
 
uniform samplerCube uSkybox;
uniform mat4 uMatrix;
 
in vec4 vPosition;

out vec4 oColor;
 
void main() {
    vec4 t = uMatrix * vPosition;
    oColor = texture(uSkybox, normalize(t.xyz / t.w));    
}
`;

export default {
    simple: {
        vertex   : vertex,
        fragment : fragment
    },
    gltf: {
        vertex   : vertexGltf,
        fragment : fragmentGltf
    },
    skybox: {
        vertex   : skyboxV,
        fragment : skyboxF
    }
};
