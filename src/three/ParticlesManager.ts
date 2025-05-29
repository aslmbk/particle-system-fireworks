import * as THREE from "three";
import { MATH } from "./lib";
import { TimeEventArgs } from "./engine/Time";
import { Viewport, ViewportEventArgs } from "./engine/Viewport";
import {
  vertexShader,
  fragmentShader,
  ParticleRenderer,
  Emitter,
  Particle,
  EmitterShape,
  ParticleSystem,
} from "./particles";
import { Loader } from "./engine/Loader";

export class ParticlesManager {
  private particleSystem!: ParticleSystem;
  private fireworkMaterial!: THREE.ShaderMaterial;
  private smokeMaterial!: THREE.ShaderMaterial;
  private materials: THREE.ShaderMaterial[] = [];

  public scene = new THREE.Group();

  constructor(loader: Loader, viewport: Viewport) {
    this.particleSystem = new ParticleSystem();
    Promise.all([
      this.initFireworkMaterial(loader, viewport),
      this.initSmokeMaterial(loader, viewport),
    ]).then(() => {
      this.createTrailEmitter();
    });

    this.scene.position.y = -15;
  }

  private async initFireworkMaterial(loader: Loader, viewport: Viewport) {
    const sizeOverLife = new MATH.FloatInterpolant([
      { time: 0, value: 0.2 },
      { time: 0.1, value: 1 },
      { time: 6, value: 1 },
      { time: 10, value: 0 },
    ]);

    const alphaOverLife = new MATH.FloatInterpolant([
      { time: 0, value: 0 },
      { time: 0.25, value: 1 },
      { time: 3, value: 1 },
      { time: 3.1, value: 0 },
    ]);

    const colorOverLife = new MATH.ColorInterpolant([
      { time: 0, value: new THREE.Color().setHSL(0, 1, 0.75) },
      { time: 2, value: new THREE.Color().setHSL(0.5, 1, 0.75) },
      { time: 5, value: new THREE.Color().setHSL(1, 1, 0.75) },
    ]);

    const twinkleOverLife = new MATH.FloatInterpolant([
      { time: 0, value: 0 },
      { time: 3, value: 1 },
      { time: 4, value: 1 },
    ]);

    const mapTexture = await loader.loadTextureAsync({
      url: "/textures/star.png",
    });

    this.fireworkMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uMap: new THREE.Uniform(mapTexture),
        uTime: new THREE.Uniform(0),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            viewport.width * viewport.pixelRatio,
            viewport.height * viewport.pixelRatio
          )
        ),
        uSize: new THREE.Uniform(0.5),
        uSizeOverLife: new THREE.Uniform(sizeOverLife.toTexture()),
        uColorOverLife: new THREE.Uniform(
          colorOverLife.toTexture(alphaOverLife)
        ),
        uTwinkleOverLife: new THREE.Uniform(twinkleOverLife.toTexture()),
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(this.fireworkMaterial);
  }

  private async initSmokeMaterial(loader: Loader, viewport: Viewport) {
    const sizeOverLife = new MATH.FloatInterpolant([
      { time: 0, value: 1 },
      { time: 1, value: 1.5 },
      { time: 2, value: 2.5 },
    ]);

    const alphaOverLife = new MATH.FloatInterpolant([
      { time: 0, value: 0.3 },
      { time: 0.05, value: 0.5 },
      { time: 0.1, value: 0.3 },
      { time: 0.2, value: 0.05 },
      { time: 0.4, value: 0 },
      { time: 1, value: 0 },
    ]);

    const colorOverLife = new MATH.ColorInterpolant([
      { time: 0, value: new THREE.Color(0xcecece) },
      { time: 1, value: new THREE.Color(0x000000) },
    ]);

    const mapTexture = await loader.loadTextureAsync({
      url: "/textures/smoke.png",
    });

    this.smokeMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uMap: new THREE.Uniform(mapTexture),
        uTime: new THREE.Uniform(0),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            viewport.width * viewport.pixelRatio,
            viewport.height * viewport.pixelRatio
          )
        ),
        uSize: new THREE.Uniform(0.5),
        uSizeOverLife: new THREE.Uniform(sizeOverLife.toTexture()),
        uColorOverLife: new THREE.Uniform(
          colorOverLife.toTexture(alphaOverLife)
        ),
        uTwinkleOverLife: new THREE.Uniform(null),
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.materials.push(this.smokeMaterial);
  }

  private createTrailEmitter() {
    const material = this.fireworkMaterial.clone();
    this.materials.push(material);
    const particleRenderer = new ParticleRenderer({
      material: material,
      maxParticles: 100,
      scene: this.scene,
    });
    const particleShapePairs = new Map<Particle, PointShape>();
    const particleEmitterPairs = new Map<Particle, Emitter>();

    const emiiter = new Emitter({
      renderer: particleRenderer,
      shape: new PointShape(),
      maxLife: 3,
      velocityMagnitude: 30,
      velocityMagnitudeVariance: 0,
      rotation: new THREE.Quaternion(),
      rotationAngularVariance: Math.PI / 8,
      gravity: new THREE.Vector3(0, -9.81, 0),
      gravityStrength: 0.4,
      dragCoefficient: 1,
      maxParticles: 100,
      emissionRate: 1,
      maxEmission: Number.MAX_SAFE_INTEGER,
      onCreateParticle: (particle) => {
        const shape = new PointShape();
        particleShapePairs.set(particle, shape);
        const emitter = this.createSmokeEmitter(shape);
        particleEmitterPairs.set(particle, emitter);
      },
      onUpdateParticle: (particle) => {
        const shape = particleShapePairs.get(particle);
        if (shape) shape.position.copy(particle.position);
      },
      onRemoveParticle: (particle) => {
        const smokeShape = particleShapePairs.get(particle);
        if (smokeShape) particleShapePairs.delete(particle);
        const smokeEmitter = particleEmitterPairs.get(particle);
        if (smokeEmitter) smokeEmitter.stopEmission();
        particleEmitterPairs.delete(particle);

        const popShape = new PointShape();
        popShape.position.copy(particle.position);
        this.createPopEmitter(popShape);
      },
    });
    this.particleSystem.addEmitter(emiiter);
  }

  private createSmokeEmitter(shape: EmitterShape = new PointShape()) {
    const material = this.smokeMaterial.clone();
    this.materials.push(material);
    const particleRenderer = new ParticleRenderer({
      material: material,
      maxParticles: 500,
      scene: this.scene,
    });

    const emiiter = new Emitter({
      renderer: particleRenderer,
      shape,
      maxLife: 2,
      velocityMagnitude: 4,
      velocityMagnitudeVariance: 2,
      rotation: new THREE.Quaternion(),
      rotationAngularVariance: Math.PI / 8,
      gravity: new THREE.Vector3(0, -9.81, 0),
      gravityStrength: 0,
      dragCoefficient: 0.5,
      maxParticles: 500,
      emissionRate: 100,
      maxEmission: 500,
    });
    this.particleSystem.addEmitter(emiiter);
    return emiiter;
  }

  private createPopEmitter(shape: EmitterShape = new PointShape()) {
    const material = this.fireworkMaterial.clone();
    this.materials.push(material);
    const particleRenderer = new ParticleRenderer({
      material: material,
      maxParticles: 500,
      scene: this.scene,
    });

    const emiiter = new Emitter({
      renderer: particleRenderer,
      shape,
      maxLife: 3,
      velocityMagnitude: 20,
      velocityMagnitudeVariance: 10,
      rotation: new THREE.Quaternion(),
      rotationAngularVariance: Math.PI * 2,
      gravity: new THREE.Vector3(0, -9.81, 0),
      gravityStrength: 0.3,
      dragCoefficient: 4,
      maxParticles: 500,
      emissionRate: 5000,
      maxEmission: 500,
    });
    this.particleSystem.addEmitter(emiiter);
  }

  public update(params: TimeEventArgs) {
    this.particleSystem.step(params);
    for (let i = this.materials.length - 1; i >= 0; i--) {
      if (this.materials[i].userData.isDisposed) {
        this.materials.splice(i, 1);
        continue;
      }
      this.materials[i].uniforms.uTime.value = params.elapsed;
    }
  }

  public resize(params: ViewportEventArgs) {
    for (const material of this.materials) {
      material.uniforms.uResolution.value.set(
        params.width * params.pixelRatio,
        params.height * params.pixelRatio
      );
    }
  }
}

class PointShape extends EmitterShape {
  public readonly position = new THREE.Vector3();

  emit() {
    const particle = new Particle();
    particle.position.copy(this.position);
    return particle;
  }
}
