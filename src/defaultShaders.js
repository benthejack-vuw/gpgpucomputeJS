/*

export const stub = {
  vert:[
  ].join( "\n" ),

  frag:[
  ].join( "\n" )
}

*/

export const vertex_passthrough = [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

].join( "\n" );


export const fragment_clear_with_floats = [

		"uniform vec4 clearColor;",

		"void main() {",

			"gl_FragColor = clearColor;",

		"}"

].join( "\n" );
