import * as THREE from 'three';
import { PlayerData } from '../types';
import { createKitTexture } from './textures';

export interface PlayerMeshRig {
  group: THREE.Group;
  data: PlayerData;
  activeMarker: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftCalfPivot: THREE.Group;
  rightCalfPivot: THREE.Group;
  torsoMesh: THREE.Mesh;
  headGroup: THREE.Group;
  // Kinematic animation update
  updateAnimation: (state: 'idle' | 'running' | 'kicking' | 'tackling' | 'diving' | 'celebrating', animTime: number, speedRatio: number) => void;
  dispose: () => void;
}

export function buildPlayerModel(
  player: PlayerData,
  isHomeTeam: boolean,
  isGoalKeeper: boolean = false
): PlayerMeshRig {
  const root = new THREE.Group();
  root.name = `player_${player.id}`;

  const primaryKitColor = isGoalKeeper
    ? (isHomeTeam ? '#00e5ff' : '#ff9900') // Bright GK neon kits
    : (isHomeTeam ? '#003399' : '#b3001e'); // Royal Blue vs Scarlet
  const secondaryKitColor = isHomeTeam ? '#ffd700' : '#ffffff';
  const shortsColor = isGoalKeeper ? '#111827' : (isHomeTeam ? '#ffffff' : '#111827');

  const kitTex = createKitTexture(primaryKitColor, secondaryKitColor, player.number, player.shortName);
  const kitMaterial = new THREE.MeshStandardMaterial({
    map: kitTex,
    roughness: 0.65,
    metalness: 0.1,
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(player.skinTone),
    roughness: 0.55,
    metalness: 0.05,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(player.hairColor),
    roughness: 0.85,
    metalness: 0.0,
  });

  const bootMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(player.bootColor),
    roughness: 0.35,
    metalness: 0.4, // sleek metallic/glossy football boots
  });

  const shortsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shortsColor),
    roughness: 0.7,
    metalness: 0.05,
  });

  const socksMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryKitColor),
    roughness: 0.7,
    metalness: 0.05,
  });

  // 1. Soft contact shadow grounding disc
  const shadowGeo = new THREE.CircleGeometry(0.52, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.015;
  root.add(shadowMesh);

  // 2. Active Player floating triangle reticle
  const markerGeo = new THREE.ConeGeometry(0.18, 0.32, 4);
  const markerMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
  });
  const activeMarker = new THREE.Mesh(markerGeo, markerMat);
  activeMarker.position.y = 2.35;
  activeMarker.rotation.x = Math.PI; // point downwards
  activeMarker.visible = false;
  root.add(activeMarker);

  // 3. Pelvis / Hips & Shorts
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);

  const shortsGeo = new THREE.BoxGeometry(0.44, 0.32, 0.28);
  const shortsMesh = new THREE.Mesh(shortsGeo, shortsMaterial);
  shortsMesh.position.y = 0;
  shortsMesh.castShadow = true;
  hips.add(shortsMesh);

  // 4. Torso & Jersey
  const torsoGeo = new THREE.BoxGeometry(0.48, 0.54, 0.26);
  const torsoMesh = new THREE.Mesh(torsoGeo, kitMaterial);
  torsoMesh.position.y = 0.38;
  torsoMesh.castShadow = true;
  hips.add(torsoMesh);

  // 5. Head & Neck & Hairstyle
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.74, 0.02);
  hips.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.13, 16, 14);
  headGeo.scale(1.0, 1.15, 1.05);
  const headMesh = new THREE.Mesh(headGeo, skinMaterial);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair Mesh variation
  if (player.hairStyle === 'braids' || player.hairStyle === 'slick') {
    const hairGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.12, 12);
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.position.set(0, 0.07, -0.02);
    headGroup.add(hairMesh);
    if (player.hairStyle === 'braids') {
      // Drape braids down back
      const dreadsGeo = new THREE.BoxGeometry(0.18, 0.24, 0.08);
      const dreadsMesh = new THREE.Mesh(dreadsGeo, hairMaterial);
      dreadsMesh.position.set(0, -0.04, -0.12);
      headGroup.add(dreadsMesh);
    }
  } else if (player.hairStyle === 'afro') {
    const afroGeo = new THREE.SphereGeometry(0.16, 12, 10);
    const afroMesh = new THREE.Mesh(afroGeo, hairMaterial);
    afroMesh.position.set(0, 0.08, -0.01);
    headGroup.add(afroMesh);
  } else {
    // Fade / Buzz cut
    const buzzGeo = new THREE.SphereGeometry(0.135, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const buzzMesh = new THREE.Mesh(buzzGeo, hairMaterial);
    buzzMesh.position.set(0, 0.04, 0);
    headGroup.add(buzzMesh);
  }

  // 6. Arms (Left & Right)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.29, 0.56, 0);
  hips.add(leftArmPivot);

  const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.44, 10);
  armGeo.translate(0, -0.22, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, skinMaterial);
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);

  // Sleeve on shoulder
  const sleeveGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.18, 10);
  sleeveGeo.translate(0, -0.09, 0);
  const leftSleeveMesh = new THREE.Mesh(sleeveGeo, kitMaterial);
  leftArmPivot.add(leftSleeveMesh);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.29, 0.56, 0);
  hips.add(rightArmPivot);

  const rightArmMesh = new THREE.Mesh(armGeo, skinMaterial);
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);

  const rightSleeveMesh = new THREE.Mesh(sleeveGeo, kitMaterial);
  rightArmPivot.add(rightSleeveMesh);

  // 7. Legs (Left & Right)
  // Left Leg
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, -0.16, 0);
  hips.add(leftLegPivot);

  const thighGeo = new THREE.CylinderGeometry(0.085, 0.072, 0.36, 10);
  thighGeo.translate(0, -0.18, 0);
  const leftThighMesh = new THREE.Mesh(thighGeo, skinMaterial);
  leftThighMesh.castShadow = true;
  leftLegPivot.add(leftThighMesh);

  const leftCalfPivot = new THREE.Group();
  leftCalfPivot.position.set(0, -0.36, 0);
  leftLegPivot.add(leftCalfPivot);

  const calfGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.38, 10);
  calfGeo.translate(0, -0.19, 0);
  const leftCalfMesh = new THREE.Mesh(calfGeo, socksMaterial);
  leftCalfMesh.castShadow = true;
  leftCalfPivot.add(leftCalfMesh);

  // Boot
  const bootGeo = new THREE.BoxGeometry(0.11, 0.09, 0.22);
  const leftBootMesh = new THREE.Mesh(bootGeo, bootMaterial);
  leftBootMesh.position.set(0, -0.38, 0.04);
  leftBootMesh.castShadow = true;
  leftCalfPivot.add(leftBootMesh);

  // Right Leg
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, -0.16, 0);
  hips.add(rightLegPivot);

  const rightThighMesh = new THREE.Mesh(thighGeo, skinMaterial);
  rightThighMesh.castShadow = true;
  rightLegPivot.add(rightThighMesh);

  const rightCalfPivot = new THREE.Group();
  rightCalfPivot.position.set(0, -0.36, 0);
  rightLegPivot.add(rightCalfPivot);

  const rightCalfMesh = new THREE.Mesh(calfGeo, socksMaterial);
  rightCalfMesh.castShadow = true;
  rightCalfPivot.add(rightCalfMesh);

  const rightBootMesh = new THREE.Mesh(bootGeo, bootMaterial);
  rightBootMesh.position.set(0, -0.38, 0.04);
  rightBootMesh.castShadow = true;
  rightCalfPivot.add(rightBootMesh);

  // Animation Rig Logic
  const updateAnimation = (
    state: 'idle' | 'running' | 'kicking' | 'tackling' | 'diving' | 'celebrating',
    animTime: number,
    speedRatio: number
  ) => {
    // Reticle float & spin
    if (activeMarker.visible) {
      activeMarker.rotation.y = animTime * 3;
      activeMarker.position.y = 2.35 + Math.sin(animTime * 6) * 0.06;
    }

    if (state === 'running') {
      const freq = 12 * Math.max(0.5, speedRatio);
      const swing = Math.sin(animTime * freq) * 0.75;

      leftLegPivot.rotation.x = swing;
      rightLegPivot.rotation.x = -swing;

      leftCalfPivot.rotation.x = swing < 0 ? -swing * 0.8 : 0;
      rightCalfPivot.rotation.x = -swing < 0 ? swing * 0.8 : 0;

      leftArmPivot.rotation.x = -swing * 0.8;
      rightArmPivot.rotation.x = swing * 0.8;

      hips.position.y = 0.92 + Math.abs(Math.sin(animTime * freq)) * 0.05;
      torsoMesh.rotation.x = 0.15; // athletic forward lean
      torsoMesh.rotation.y = 0;
      headGroup.rotation.x = -0.1;
    } else if (state === 'kicking') {
      // Powerful kick swing
      const kickProgress = Math.min(1, (animTime % 0.45) / 0.45);
      if (kickProgress < 0.3) {
        // Windup back
        rightLegPivot.rotation.x = -1.1;
        rightCalfPivot.rotation.x = 0.9;
        torsoMesh.rotation.x = -0.15;
      } else {
        // Explosive strike follow through
        const strike = (kickProgress - 0.3) / 0.7;
        rightLegPivot.rotation.x = -1.1 + strike * 2.3;
        rightCalfPivot.rotation.x = 0.2;
        torsoMesh.rotation.x = 0.25;
      }
      leftLegPivot.rotation.x = 0.1;
      leftArmPivot.rotation.z = -0.5;
      rightArmPivot.rotation.z = 0.5;
    } else if (state === 'tackling') {
      // Slide tackle
      leftLegPivot.rotation.x = 1.3;
      rightLegPivot.rotation.x = -0.8;
      hips.position.y = 0.45;
      torsoMesh.rotation.x = -0.4;
    } else if (state === 'diving') {
      // Goalkeeper horizontal leap
      hips.position.y = 0.8;
      root.rotation.z = 1.1;
      leftArmPivot.rotation.z = -1.3;
      rightArmPivot.rotation.z = -1.1;
    } else if (state === 'celebrating') {
      // SIUU / Arms wide open
      hips.position.y = 0.92 + Math.sin(animTime * 4) * 0.1;
      leftArmPivot.rotation.z = -1.4;
      rightArmPivot.rotation.z = 1.4;
      leftArmPivot.rotation.x = 0;
      rightArmPivot.rotation.x = 0;
      leftLegPivot.rotation.x = 0;
      rightLegPivot.rotation.x = 0;
      torsoMesh.rotation.x = -0.1;
      root.rotation.y += 0.03; // turntable celebration
    } else {
      // Idle breathing
      const breath = Math.sin(animTime * 2.5);
      hips.position.y = 0.92 + breath * 0.015;
      leftLegPivot.rotation.x = 0.05;
      rightLegPivot.rotation.x = -0.05;
      leftCalfPivot.rotation.x = 0;
      rightCalfPivot.rotation.x = 0;
      leftArmPivot.rotation.x = 0.1 + breath * 0.04;
      rightArmPivot.rotation.x = 0.1 - breath * 0.04;
      leftArmPivot.rotation.z = -0.1;
      rightArmPivot.rotation.z = 0.1;
      torsoMesh.rotation.x = 0.04;
      root.rotation.z = 0;
    }
  };

  const dispose = () => {
    kitTex.dispose();
    kitMaterial.dispose();
    skinMaterial.dispose();
    hairMaterial.dispose();
    bootMaterial.dispose();
    shortsMaterial.dispose();
    socksMaterial.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    markerGeo.dispose();
    markerMat.dispose();
  };

  return {
    group: root,
    data: player,
    activeMarker,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    leftCalfPivot,
    rightCalfPivot,
    torsoMesh,
    headGroup,
    updateAnimation,
    dispose,
  };
}
