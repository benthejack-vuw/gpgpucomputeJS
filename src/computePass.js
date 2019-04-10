import * as SHADER from './defaultShaders.js'
import {
  FloatType,
  WebGLRenderTarget,
  ClampToEdgeWrapping,
  NearestFilter,
  RGBAFormat,
  Scene,
  PlaneGeometry,
  Mesh,
  OrthographicCamera,
  Vector4,
  ShaderMaterial,
  NormalBlending,
  DataTexture
} from 'three'


export default class ComputePass{

  constructor(i_bufferSize, i_shaderMaterial, i_doubleBuffer, i_precision, i_scene, i_camera){
      this.bufferSize = i_bufferSize;
      this.updateFunction = function(){};
    	this.shaderMaterial = i_shaderMaterial;
    	this.doubleBuffer = i_doubleBuffer;
    	this.currentBuffer = 0;
    	this.frameBuffers = [];
    	this.isTempDataTexture = false;
    	this.size = i_bufferSize;
    	this.precision = i_precision === undefined ? FloatType : i_precision;
      this.linked_buffers = {};

    	this.__add_frame_buffer(this.bufferSize, this.precision);
    	if(i_doubleBuffer)
    		this.__add_frame_buffer(this.bufferSize, this.precision);

    	this.__build_scene(i_scene);
      this.__build_camera(i_camera);
  }


  __add_frame_buffer(i_bufferSize, i_precision){

    this.frameBuffers.push(
      new WebGLRenderTarget(i_bufferSize.x, i_bufferSize.y, {
        type:i_precision,
        depthBuffer:false,
        stencilBuffer:false,
        generateMipmaps:false,
        wrapS:ClampToEdgeWrapping,
        wrapT:ClampToEdgeWrapping,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat
      })
    );

  }


  __build_scene(i_scene){

    if(i_scene === undefined){
      this.scene = new Scene();
      this.planeGeom = new PlaneGeometry( this.bufferSize.x, this.bufferSize.y );
      this.plane = new Mesh( this.planeGeom, this.shaderMaterial );
      this.scene.add(this.plane);
    }else{
      this.scene = i_scene;
    }

  }


  __build_camera(i_camera){

    if(i_camera === undefined){
      this.camera = new OrthographicCamera(-this.bufferSize.x/2, this.bufferSize.y/2, this.bufferSize.x/2, -this.bufferSize.y/2, -1000000, 1000000);
      this.camera.position.z = 100;
    }else{
      this.camera = i_camera;
    }

  }

  __update_linked_buffer_textures(){

    const keys = Object.keys(this.linked_buffers);
    let uniform_name;

    for(let i = 0; i < keys.length; ++i){
      uniform_name = keys[i];
      this.set_uniform(uniform_name, this.linked_buffers[uniform_name].get_output_texture());
    }

  }

  link_pass_to_uniform(uniform_name, compute_pass){
    this.linked_buffers[uniform_name] = compute_pass;
  }

  set_uniform(uniform_name, value){
    this.shaderMaterial.uniforms[uniform_name].value = value;
  }

  set_update_function(i_updateFunc){
  	this.updateFunction = i_updateFunc;
  }

  update(){
    this.__update_linked_buffer_textures();
  	this.updateFunction();
  }


  init_data(size, data) {

  	let texture = new DataTexture(
  		new Float32Array(data),
  		size.x,
  		size.y,
  		RGBAFormat,
  		this.precision,
  		null,
  		ClampToEdgeWrapping,
  		ClampToEdgeWrapping,
  		NearestFilter,
  		NearestFilter
  	);

  	texture.needsUpdate = true;
  	this.shaderMaterial.uniforms.computedOutput.value = texture;
  	this.isTempDataTexture = true;

  }

  get_output_texture(i_next){

  	if(this.isTempDataTexture){
  		return this.shaderMaterial.uniforms.computedOutput.value;
    }
  	else if(i_next || !this.doubleBuffer){
  		return this.frameBuffers[this.currentBuffer].texture;
    }
  	else{
  		return this.frameBuffers[(this.currentBuffer+1)%2].texture;
    }

  }

  render(i_renderer){

    i_renderer.setRenderTarget(this.frameBuffers[this.currentBuffer]);
  	if(this.autoClear){
      i_renderer.clear();
    }
  	i_renderer.render(this.scene, this.camera);
    i_renderer.setRenderTarget(null);

  	//initData creates a temporary texture as the computedOutput of the shader,
  	//after the first compute it can be disposed of as the data is now written to the FBO;
  	if(this.isTempDataTexture){
  	   this.shaderMaterial.uniforms.computedOutput.value.dispose();
  	   this.isTempDataTexture = false;
  	}
    	//pingpong the buffers if double buffering is activated
    	if(this.doubleBuffer){
    		this.shaderMaterial.uniforms.computedOutput.value = this.frameBuffers[this.currentBuffer].texture;
    		this.currentBuffer = (this.currentBuffer+1)%2;
    	}


  }


  clear(i_renderer){

  	for(let i = 0; i < this.frameBuffers.length; ++i){
  		i_renderer.clearTarget(this.frameBuffers[i],true);
    }
    
  }

  //renders rgb values to the fbo using a shader
  clear_with_float_values(i_r, i_g, i_b, i_a, i_renderer){

  	if(!this.clearScene){

  		this.clearScene = new Scene();

  		let clearUniforms = {
  			clearColor:{type: "v4", value: new Vector4(i_r, i_g, i_b, i_a)}
  		}

  		this.clearMaterial = new ShaderMaterial( {
  					uniforms: clearUniforms,
  					vertexShader:   SHADER.vertex_passthrough,
  					fragmentShader: SHADER.fragment_clear_with_floats,
  					blending:       NormalBlending,
  					depthTest:      false,
  					transparent:    false
  		});

  		let clearMesh = new Mesh(this.planeGeom, this.clearMaterial);
  		this.clearScene.add(clearMesh);

  	}else{
  		this.clearMaterial.uniforms.clearColor.value = new Vector4(i_r, i_g, i_b, i_a);
  	}

  	i_renderer.render(this.clearScene, this.camera, this.frameBuffers[this.currentBuffer], true );

  }


}
