/*
*		small library that facilitates GPU comupting with GLSL shaders. uses Three.js
*
* 		Ben Jack, 2015
*
*/

export default class GPUComputeProgram{

  constructor(i_renderer){

  	let gl = i_renderer.getContext();

  	if( !gl.getExtension( "OES_texture_float" )) {
  		alert( "No OES_texture_float support for float textures!" );
  		return;
  	}

  	if( gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0) {
  		alert( "No support for vertex shader textures!" );
  		return;
  	}

  	this.renderer = i_renderer;
  	this.passes = [];

  }


  add_pass(i_computePass){
  	this.passes.push(i_computePass);
  }


  render(){

  	for(let i = 0; i < this.passes.length; ++i){
  		this.passes[i].update();
  		this.passes[i].render(this.renderer);
  	}

  }

}
