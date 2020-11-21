const vertex = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uViewModel;
uniform mat4 uProjection;
uniform vec3 uLightPosition;
uniform vec3 uLightAttenuation;

out vec3 vEye;
out vec3 vLight;
out vec3 vNormal;
out vec2 vTexCoord;
out float vAttenuation;

void main() {
    vec3 vertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    vec3 lightPosition = (uViewModel * vec4(uLightPosition, 1)).xyz;
    vEye = -vertexPosition;
    vLight = lightPosition - vertexPosition;
    vNormal = (uViewModel * vec4(aNormal, 0)).xyz;
    vTexCoord = aTexCoord;

    float d = distance(vertexPosition, lightPosition);
    vec3 attenuation = uLightAttenuation * vec3(1, d, d * d);
    vAttenuation = 1.0 / dot(attenuation, vec3(1, 1, 1));

    gl_Position = uProjection * vec4(vertexPosition, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

uniform float uShininess;

in vec3 vEye;
in vec3 vLight;
in vec3 vNormal;
in vec2 vTexCoord;
in float vAttenuation;

out vec4 oColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vLight);
    vec3 E = normalize(vEye);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uShininess);

    lambert = smoothstep(0.0, 1.0, lambert);
    float toon = floor(lambert * 10.0) / 10.0;
 
    vec3 ambient = uAmbientColor;
    vec3 diffuse = uDiffuseColor * toon;
    vec3 specular = uSpecularColor * phong;
    vec3 light = (ambient + diffuse);
    

    oColor = texture(uTexture, vTexCoord) * vec4(light,1);
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
}
`;

const skyboxV = `#version 300 es
layout (location = 0) in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1.0;
}
`;

const skyboxF = `#version 300 es
precision highp float;
 
uniform samplerCube uSkybox;
uniform mat4 uViewMat;
 
in vec4 v_position;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  vec4 t = uViewMat * v_position;
  outColor = texture(uSkybox, normalize(t.xyz / t.w));
}
`

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
