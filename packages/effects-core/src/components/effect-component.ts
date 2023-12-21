import * as spec from '@galacean/effects-specification';
import { Matrix4 } from '@galacean/effects-math/es/core/matrix4';
import type { Deserializer, EffectComponentData, SceneData } from '../deserializer';
import type { Engine } from '../engine';
import { glContext } from '../gl';
import { setBlendMode, type Material, type MaterialDestroyOptions } from '../material';
import type { MeshDestroyOptions, Renderer } from '../render';
import { Geometry } from '../render';
import type { Disposable } from '../utils';
import { DestroyOptions } from '../utils';
import { RendererComponent } from './renderer-component';

let seed = 1;

/**
 * @since 2.0.0
 * @internal
 */
export class EffectComponent extends RendererComponent implements Disposable {
  /**
   * Mesh 的全局唯一 id
   */
  readonly id: string;
  /**
   * Mesh 的世界矩阵
   */
  worldMatrix = Matrix4.fromIdentity();
  /**
   * Mesh 的 Geometry
   */
  geometry: Geometry;

  protected destroyed = false;
  private visible = false;

  constructor (engine: Engine) {
    super(engine);

    this.id = 'Mesh' + seed++;
    this.name = '<unnamed>';
    this._priority = 0;
    this.geometry = Geometry.create(this.engine, {
      mode: glContext.TRIANGLES,
      attributes: {
        aPos: {
          type: glContext.FLOAT,
          size: 3,
          data: new Float32Array([
            -24.1306, 0, 80.0432, 25.2414, 0, 80.0413, 24.7642, 0, 76.9534, -23.6524, 0, 76.9554, -19.4331, 0, 157.237, 20.542, 0, 157.237, 21.329, 0, 154.149, -20.2199, 0, 154.149, 22.0945, 0, 151.062, -20.985, 0, 151.062,
            22.815, 0, 147.974, -21.7051, 0, 147.974, 23.4924, 0, 144.886, -22.3817, 0, 144.886, 24.1121, 0, 141.798, -23.0007, 0, 141.798, 24.6665, 0, 138.71, -23.5545, 0, 138.711, 25.1565, 0, 135.622, -24.0441, 0, 135.623,
            25.5914, 0, 132.535, -24.478, 0, 132.535, 25.9721, 0, 129.447, -24.8577, 0, 129.447, 26.2969, 0, 126.359, -25.182, 0, 126.36, 26.5684, 0, 123.271, -25.4523, 0, 123.272, 26.7882, 0, 120.183, -25.6721, 0, 120.184,
            26.9623, 0, 117.095, -25.8477, 0, 117.096, 27.0905, 0, 114.007, -25.9744, 0, 114.009, 27.1779, 0, 110.92, -26.0598, 0, 110.921, 27.2273, 0, 107.832, -26.109, 0, 107.833, 27.2411, 0, 104.744, -26.123, 0, 104.745,
            27.2108, 0, 101.656, -26.0926, 0, 101.658, 27.1104, 0, 98.5683, -25.9929, 0, 98.5697, 26.9418, 0, 95.4805, -25.8247, 0, 95.482, 26.7095, 0, 92.3926, -25.5928, 0, 92.3942, 26.4173, 0, 89.3048, -25.3013, 0, 89.3065,
            26.0709, 0, 86.2169, -24.9557, 0, 86.2187, 25.6901, 0, 83.1291, -24.5775, 0, 83.1309, 5.99812, 0, -0.242529, -4.92743, 0, -0.238635, -5.62864, 0, 2.84913, 6.69914, 0, 2.84532, -6.37102, 0, 5.93689, 7.44008, 0, 5.93315,
            -7.14734, 0, 9.02465, 8.21685, 0, 9.02099, -7.95257, 0, 12.1124, 9.02581, 0, 12.1088, -8.78814, 0, 15.2002, 9.86244, 0, 15.1967, -9.64552, 0, 18.2879, 10.7212, 0, 18.2845, -10.5184, 0, 21.3757, 11.5958, 0, 21.3723,
            -11.4037, 0, 24.4635, 12.4789, 0, 24.4602, -12.2815, 0, 27.5512, 13.3624, 0, 27.548, -13.1545, 0, 30.639, 14.2378, 0, 30.6359, -14.0101, 0, 33.7267, 15.0957, 0, 33.7237, -14.8608, 0, 36.8145, 15.9446, 0, 36.8115,
            -15.6911, 0, 39.9023, 16.7773, 0, 39.8994, -16.5024, 0, 42.99, 17.5954, 0, 42.9872, -17.2824, 0, 46.0778, 18.3736, 0, 46.075, -18.0198, 0, 49.1656, 19.1181, 0, 49.1629, -18.7441, 0, 52.2533, 19.8448, 0, 52.2507,
            -19.4503, 0, 55.3411, 20.5532, 0, 55.3386, -20.1125, 0, 58.4288, 21.2134, 0, 58.4264, -20.7566, 0, 61.5166, 21.8596, 0, 61.5142, -21.3871, 0, 64.6044, 22.4922, 0, 64.6021, -21.9985, 0, 67.6921, 23.1053, 0, 67.6899,
            -22.5985, 0, 70.7799, 23.7069, 0, 70.7777, -23.1418, 0, 73.8676, 24.2517, 0, 73.8656,
          ]),
        },
        aUV: {
          type: glContext.FLOAT,
          size: 2,
          data: new Float32Array([
            0.509804, 8.37517e-09, 0.509804, 1, 0.490196, 1, 0.490196, 7.51809e-09, 1, 2.98023e-08, 1, 1, 0.980392, 1, 0.980392, 2.89452e-08, 0.960784, 1, 0.960784, 2.80881e-08,
            0.941176, 1, 0.941176, 2.72311e-08, 0.921569, 1, 0.921569, 2.6374e-08, 0.901961, 1, 0.901961, 2.55169e-08, 0.882353, 1, 0.882353, 2.46598e-08, 0.862745, 1, 0.862745, 2.38027e-08,
            0.843137, 1, 0.843137, 2.29456e-08, 0.823529, 1, 0.823529, 2.20885e-08, 0.803922, 1, 0.803922, 2.12315e-08, 0.784314, 1, 0.784314, 2.03744e-08, 0.764706, 1, 0.764706, 1.95173e-08,
            0.745098, 1, 0.745098, 1.86602e-08, 0.72549, 1, 0.72549, 1.78031e-08, 0.705882, 1, 0.705882, 1.6946e-08, 0.686274, 1, 0.686275, 1.60889e-08, 0.666667, 1, 0.666667, 1.52319e-08,
            0.647059, 1, 0.647059, 1.43748e-08, 0.627451, 1, 0.627451, 1.35177e-08, 0.607843, 1, 0.607843, 1.26606e-08, 0.588235, 1, 0.588235, 1.18035e-08, 0.568627, 1, 0.568627, 1.09464e-08,
            0.54902, 1, 0.54902, 1.00893e-08, 0.529412, 1, 0.529412, 9.23226e-09, 0, 1, 0, -1.39091e-08, 0.0196078, -1.3052e-08, 0.0196078, 1, 0.0392157, -1.21949e-08, 0.0392157, 1,
            0.0588235, -1.13378e-08, 0.0588235, 1, 0.0784313, -1.04807e-08, 0.0784314, 1, 0.0980392, -9.62364e-09, 0.0980392, 1, 0.117647, -8.76655e-09, 0.117647, 1, 0.137255, -7.90947e-09, 0.137255, 1,
            0.156863, -7.05238e-09, 0.156863, 1, 0.176471, -6.19529e-09, 0.176471, 1, 0.196078, -5.33821e-09, 0.196078, 1, 0.215686, -4.48112e-09, 0.215686, 1, 0.235294, -3.62403e-09, 0.235294, 1,
            0.254902, -2.76695e-09, 0.254902, 1, 0.27451, -1.90986e-09, 0.27451, 1, 0.294118, -1.05278e-09, 0.294118, 1, 0.313725, -1.9569e-10, 0.313725, 1, 0.333333, 6.61396e-10, 0.333333, 1,
            0.352941, 1.51848e-09, 0.352941, 1, 0.372549, 2.37557e-09, 0.372549, 1, 0.392157, 3.23265e-09, 0.392157, 1, 0.411765, 4.08974e-09, 0.411765, 1, 0.431373, 4.94683e-09, 0.431373, 1,
            0.45098, 5.80391e-09, 0.45098, 1, 0.470588, 6.661e-09, 0.470588, 1,
          ]),
        },
      },
      indices: {
        data: new Uint16Array([
          0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 7, 6, 8, 7, 8, 9, 9, 8, 10, 9, 10, 11, 11, 10, 12, 11, 12, 13,
          13, 12, 14, 13, 14, 15, 15, 14, 16, 15, 16, 17, 17, 16, 18, 17, 18, 19, 19, 18, 20, 19, 20, 21, 21, 20, 22, 21, 22, 23,
          23, 22, 24, 23, 24, 25, 25, 24, 26, 25, 26, 27, 27, 26, 28, 27, 28, 29, 29, 28, 30, 29, 30, 31, 31, 30, 32, 31, 32, 33,
          33, 32, 34, 33, 34, 35, 35, 34, 36, 35, 36, 37, 37, 36, 38, 37, 38, 39, 39, 38, 40, 39, 40, 41, 41, 40, 42, 41, 42, 43,
          43, 42, 44, 43, 44, 45, 45, 44, 46, 45, 46, 47, 47, 46, 48, 47, 48, 49, 49, 48, 50, 49, 50, 51, 51, 50, 52, 51, 52, 53,
          53, 52, 1, 53, 1, 0, 54, 55, 56, 54, 56, 57, 57, 56, 58, 57, 58, 59, 59, 58, 60, 59, 60, 61, 61, 60, 62, 61, 62, 63,
          63, 62, 64, 63, 64, 65, 65, 64, 66, 65, 66, 67, 67, 66, 68, 67, 68, 69, 69, 68, 70, 69, 70, 71, 71, 70, 72, 71, 72, 73,
          73, 72, 74, 73, 74, 75, 75, 74, 76, 75, 76, 77, 77, 76, 78, 77, 78, 79, 79, 78, 80, 79, 80, 81, 81, 80, 82, 81, 82, 83,
          83, 82, 84, 83, 84, 85, 85, 84, 86, 85, 86, 87, 87, 86, 88, 87, 88, 89, 89, 88, 90, 89, 90, 91, 91, 90, 92, 91, 92, 93,
          93, 92, 94, 93, 94, 95, 95, 94, 96, 95, 96, 97, 97, 96, 98, 97, 98, 99, 99, 98, 100, 99, 100, 101, 101, 100, 102, 101, 102, 103,
          103, 102, 3, 103, 3, 2,
        ]), releasable: true,
      },
      drawCount: 306,
    });
  }

  get isDestroyed (): boolean {
    return this.destroyed;
  }

  /**
   * 设置当前 Mesh 的可见性。
   * @param visible - true：可见，false：不可见
   */
  setVisible (visible: boolean) {
    this.visible = visible;
  }

  override render (renderer: Renderer) {
    const material = this.material;
    const geo = this.geometry;

    if (renderer.renderingData.currentFrame.globalUniforms) {
      renderer.setGlobalMatrix('effects_ObjectToWorld', this.transform.getWorldMatrix());
    }

    // 执行 Geometry 的数据刷新
    geo.flush();

    renderer.drawGeometry(geo, material);
  }

  /**
   * 获取当前 Mesh 的可见性。
   */
  getVisible (): boolean {
    return this.visible;
  }

  /**
   * 获取当前 Mesh 的第一个 geometry。
   */
  firstGeometry (): Geometry {
    return this.geometry;
  }

  /**
   * 设置当前 Mesh 的材质
   * @param material - 要设置的材质
   * @param destroy - 可选的材质销毁选项
   */
  setMaterial (material: Material, destroy?: MaterialDestroyOptions | DestroyOptions.keep) {
    if (destroy !== DestroyOptions.keep) {
      this.material.dispose(destroy);
    }
    this.material = material;
  }

  override fromData (data: any, deserializer?: Deserializer, sceneData?: SceneData): void {
    super.fromData(data, deserializer, sceneData);
    const effectComponentData: EffectComponentData = data;

    this._priority = effectComponentData._priority;
    if (deserializer && sceneData) {
      this.material = deserializer.deserialize(effectComponentData.materials[0], sceneData);
      this.material.blending = true;
      setBlendMode(this.material, spec.BlendingMode.ALPHA);
    }
  }

  /**
   * 销毁当前资源
   * @param options - 可选的销毁选项
   */
  override dispose (options?: MeshDestroyOptions) {
    if (this.destroyed) {
      //console.error('call mesh.destroy multiple times', this);
      return;
    }

    if (options?.geometries !== DestroyOptions.keep) {
      this.geometry.dispose();
    }
    const materialDestroyOption = options?.material;

    if (materialDestroyOption !== DestroyOptions.keep) {
      this.material.dispose(materialDestroyOption);
    }
    this.destroyed = true;

    if (this.engine !== undefined) {
      //this.engine.removeMesh(this);
      // @ts-expect-error
      this.engine = undefined;
    }
  }
}
