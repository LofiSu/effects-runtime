import type { Composition, Mesh, RenderFrame, Scene, Texture, VFXItem } from '@galacean/effects';
import { AbstractPlugin, RenderPass, RenderPassPriorityPostprocess, RenderPassPriorityPrepare, TextureLoadAction } from '@galacean/effects';
import { GizmoVFXItem } from './gizmo-vfx-item';
import { GizmoSubType, GizmoVFXItemType } from './define';
import { destroyWireframeMesh } from './wireframe';
import { axisIconMap } from './constants';
import { createImage, createTexture } from './util';
import { GeometryType } from './geometry';

const editorRenderPassName = 'editor-gizmo';
const frontRenderPassName = 'front-gizmo';
const behindRenderPassName = 'behind-gizmo';
const iconImages: Map<string, HTMLImageElement> = new Map();
const iconTextures: Map<string, Texture> = new Map();

export class EditorGizmoPlugin extends AbstractPlugin {

  meshToAdd: Mesh[] = [];

  meshToRemove: Mesh[] = [];
  override order = 1001;

  static override async prepareResource (scene: Scene): Promise<any> {
    if (iconImages.size !== axisIconMap.size) {
      for (const [name, data] of axisIconMap) {
        iconImages.set(name, await createImage(data));
      }
    }

    return true;
  }

  static onPlayerDestroy (): void {
    iconTextures.clear();
  }

  override onCompositionConstructed (composition: Composition, scene: Scene) {
    const engine = composition.renderer.engine;

    iconImages.forEach((image, name)=>{
      iconTextures.set(name, createTexture(engine, image));
    });
    iconImages.clear();
  }

  override onCompositionReset (composition: Composition) {
    const items = composition.items;
    const targetMap: { [key: number]: GizmoVFXItem[] } = {};

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item instanceof GizmoVFXItem) {
        if (!targetMap[item.target]) {
          targetMap[item.target] = [];
        }
        targetMap[item.target].push(item);
      }
    }
    composition.loaderData.gizmoTarget = targetMap;
    composition.loaderData.gizmoItems = [];
  }

  override onCompositionItemLifeBegin (composition: Composition, item: VFXItem<any>) {
    if (item.type === '7') {
      return;
    }
    const gizmoVFXItemList: GizmoVFXItem[] = composition.loaderData.gizmoTarget[item.id];

    if (gizmoVFXItemList && gizmoVFXItemList.length > 0) {
      for (const gizmoVFXItem of gizmoVFXItemList) {
        switch (gizmoVFXItem.subType) {
          case GizmoSubType.particleEmitter:
            gizmoVFXItem.createParticleContent(item, this.meshToAdd);

            break;
          case GizmoSubType.modelWireframe:
            gizmoVFXItem.createModelContent(item, this.meshToAdd);

            break;
          case GizmoSubType.box:
          case GizmoSubType.sphere:
          case GizmoSubType.cylinder:
          case GizmoSubType.cone:
          case GizmoSubType.torus:
          case GizmoSubType.sprite:
          case GizmoSubType.frustum:
          case GizmoSubType.directionLight:
          case GizmoSubType.pointLight:
          case GizmoSubType.spotLight:
          case GizmoSubType.floorGrid:
            gizmoVFXItem.createBasicContent(item, this.meshToAdd, gizmoVFXItem.subType);

            break;
          case GizmoSubType.camera:
          case GizmoSubType.light:
            gizmoVFXItem.createBasicContent(item, this.meshToAdd, gizmoVFXItem.subType, iconTextures);

            break;
          case GizmoSubType.rotation:
          case GizmoSubType.scale:
          case GizmoSubType.translation:
            gizmoVFXItem.createCombinationContent(item, this.meshToAdd, gizmoVFXItem.subType);

            break;
          case GizmoSubType.viewHelper:
            gizmoVFXItem.createCombinationContent(item, this.meshToAdd, gizmoVFXItem.subType, iconTextures);

            break;
          case GizmoSubType.boundingBox:
            gizmoVFXItem.createBoundingBoxContent(item, this.meshToAdd);

            break;
          default:
            break;
        }
      }
    }
    if (item.type === GizmoVFXItemType) {
      composition.loaderData.gizmoItems.push(item);
    }
  }

  override onCompositionItemRemoved (composition: Composition, item: VFXItem<any>) {
    if (item.type === GizmoVFXItemType) {
      this.removeGizmoItem(composition, item as unknown as GizmoVFXItem);
    } else {
      const gizmoVFXItemList: GizmoVFXItem[] = composition.loaderData.gizmoTarget[item.id];

      if (gizmoVFXItemList && gizmoVFXItemList.length > 0) {
        gizmoVFXItemList.forEach(gizmoVFXItem => {
          this.removeGizmoItem(composition, gizmoVFXItem);
        });
      }
    }
  }

  removeGizmoItem (composition: Composition, gizmoVFXItem: GizmoVFXItem) {
    if (gizmoVFXItem.content && !gizmoVFXItem.content.isDestroyed) {
      gizmoVFXItem.content.dispose();

      if (gizmoVFXItem.content.name === GeometryType.FloorGrid.toString() || gizmoVFXItem.content.name === 'Box') {
        this.getFrontRenderPass(composition.renderFrame).removeMesh(gizmoVFXItem.content);
      } else {
        this.getEditorRenderPass(composition.renderFrame).removeMesh(gizmoVFXItem.content);
      }
    }
    if (gizmoVFXItem.contents) {
      for (const [mesh] of gizmoVFXItem.contents) {
        if (!mesh.isDestroyed) {
          mesh.dispose();
          if (mesh.name === 'translation' || mesh.name === 'scale' || mesh.name === 'rotation') {
            this.getBehindRenderPass(composition.renderFrame).removeMesh(mesh);
          } else {
            this.getEditorRenderPass(composition.renderFrame).removeMesh(mesh);
          }
        }
      }
    }

    if (gizmoVFXItem.wireframeMeshes.length > 0) {
      gizmoVFXItem.wireframeMeshes.forEach(mesh => {
        if (!mesh.isDestroyed) {
          destroyWireframeMesh(mesh);
          this.getEditorRenderPass(composition.renderFrame).removeMesh(mesh);
        }
      });
    } else {
      const wireframeMesh = gizmoVFXItem.wireframeMesh;

      if (wireframeMesh && !wireframeMesh.isDestroyed) {
        destroyWireframeMesh(wireframeMesh);
        this.getEditorRenderPass(composition.renderFrame).removeMesh(wireframeMesh);
      }
    }

    const arr: GizmoVFXItem[] = composition.loaderData.gizmoItems;
    const index = arr.indexOf(gizmoVFXItem);

    if (index > -1) {
      arr.splice(index, 1);
    }
  }

  override prepareRenderFrame (composition: Composition, renderFrame: RenderFrame): boolean {
    this.meshToAdd.forEach(mesh => {
      if (mesh.name === GeometryType.FloorGrid.toString() || mesh.name === 'Box') {
        this.getFrontRenderPass(renderFrame).addMesh(mesh);
      } else if (mesh.name === 'translation' || mesh.name === 'scale' || mesh.name === 'rotation') {
        this.getBehindRenderPass(renderFrame).addMesh(mesh);
      } else {
        this.getEditorRenderPass(renderFrame).addMesh(mesh);
      }
    });
    this.meshToRemove.forEach(mesh => {
      if (mesh.name === GeometryType.FloorGrid.toString() || mesh.name === 'Box') {
        this.getFrontRenderPass(renderFrame).removeMesh(mesh);
      } else if (mesh.name === 'translation' || mesh.name === 'scale' || mesh.name === 'rotation') {
        this.getBehindRenderPass(renderFrame).removeMesh(mesh);
      } else {
        this.getEditorRenderPass(renderFrame).removeMesh(mesh);
      }
    });
    this.meshToAdd.length = this.meshToRemove.length = 0;
    composition.loaderData.gizmoItems.forEach((item: GizmoVFXItem) => item.updateRenderData());

    return false;
  }

  getBehindRenderPass (pipeline: RenderFrame): RenderPass {
    let rp = pipeline.renderPasses.find(renderPass => renderPass.name === behindRenderPassName);

    if (!rp) {
      rp = new RenderPass(pipeline.renderer, {
        name: behindRenderPassName,
        priority: RenderPassPriorityPostprocess + RenderPassPriorityPostprocess,
        clearAction: {
          depthAction: TextureLoadAction.clear,
        },
      });
      pipeline.addRenderPass(rp);
    }

    return rp;
  }

  getEditorRenderPass (pipeline: RenderFrame): RenderPass {
    let rp = pipeline.renderPasses.find(renderPass => renderPass.name === editorRenderPassName);

    if (!rp) {
      rp = new RenderPass(pipeline.renderer, {
        name: editorRenderPassName,
        priority: RenderPassPriorityPostprocess + 2,
      });
      pipeline.addRenderPass(rp);
    }

    return rp;
  }

  getFrontRenderPass (pipeline: RenderFrame): RenderPass {
    let rp = pipeline.renderPasses.find(renderPass => renderPass.name === frontRenderPassName);

    if (!rp) {
      rp = new RenderPass(pipeline.renderer, {
        name: frontRenderPassName,
        priority: RenderPassPriorityPrepare + 2,
      });
      pipeline.addRenderPass(rp);
    }

    return rp;
  }

}
