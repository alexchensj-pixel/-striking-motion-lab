import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

export default function WorldHtmlAnchor({ position = [0, 2.35, -5.5], children }) {
  const { camera, gl, size } = useThree();
  const host = useMemo(() => document.createElement('div'), []);
  const point = useMemo(() => new Vector3(...position), [position]);
  const projected = useMemo(() => new Vector3(), []);
  const canvas = gl.domElement;

  useEffect(() => {
    const world = canvas.parentElement;
    host.className = 'world-html-anchor';
    host.setAttribute('data-world-anchor', 'entrance');
    world.appendChild(host);
    return () => host.remove();
  }, [canvas, host]);

  useFrame(() => {
    projected.copy(point).project(camera);
    const visible = projected.z > -1 && projected.z < 1;
    host.style.display = visible ? 'block' : 'none';
    if (!visible) return;
    const rect = canvas.getBoundingClientRect();
    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;
    host.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  });

  return createPortal(children, host);
}
