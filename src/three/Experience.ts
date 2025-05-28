import { Engine } from "./engine";
import { DebugController } from "./DebugController";
import { Config } from "./Config";
import * as THREE from "three";
import { MATH } from "./lib";

export class Experience extends Engine {
  private static instance: Experience | null = null;

  public readonly config!: Config;
  public readonly debugController!: DebugController;

  constructor(domElement: HTMLElement) {
    if (Experience.instance) return Experience.instance;
    super({ domElement });
    Experience.instance = this;

    this.config = new Config();
    this.debugController = new DebugController(this);
    this.stats.activate();

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xfffff0 })
    );
    this.scene.add(cube);

    const interpolant = new MATH.ColorInterpolant([
      { time: 0, value: new THREE.Color(0x0000ff) },
      { time: 1, value: new THREE.Color(0x00ff00) },
    ]);

    const texture = interpolant.toTexture();
    console.log(texture);

    const alphaInterpolant = new MATH.FloatInterpolant([
      { time: 0, value: 0 },
      { time: 1, value: 1 },
      { time: 0.5, value: 0.5 },
      { time: 2, value: 0.75 },
    ]);

    const texture2 = interpolant.toTexture(alphaInterpolant);
    console.log(texture2);
  }
}
