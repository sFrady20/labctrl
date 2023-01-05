import { Box, useTheme } from "@mui/material";
import React, { memo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Uniform, Vector3 } from "three";
import { useContextBridge } from "@react-three/drei";
import fragmentShader from "!raw-loader!shaders/topfrad.glsl";
import fradient from "./gradient";

const defaultColor = new Vector3(0.2, 0.2, 0.2);

const useUniforms = (options?: {
  custom?: { [s: string]: { value: any } };
}) => {
  const uniforms = useRef({
    time: { value: 0 },
    resolution: { value: [0, 0] },
    cursor: { value: [0, 0] },
    ...options?.custom,
  });
  useFrame((f) => {
    uniforms.current.time.value = f.clock.elapsedTime;
    uniforms.current.resolution.value = [
      f.viewport.width * f.viewport.factor,
      f.viewport.height * f.viewport.factor,
    ];
    uniforms.current.cursor.value = [
      f.mouse.x * 0.5 + 0.5,
      f.mouse.y * 0.5 + 0.5,
    ];
  });
  return uniforms.current;
};

const TestScene = () => {
  const { camera } = useThree();
  const perspectiveCamera = camera as PerspectiveCamera;

  let fov_y =
    (camera.position.z * perspectiveCamera.getFilmHeight()) /
    perspectiveCamera.getFocalLength();

  const presence = useRef<Uniform>(new Uniform(1)).current;
  const activeColor = useRef<Uniform>(new Uniform(defaultColor)).current;

  const uniforms = useUniforms({ custom: { presence, activeColor } });

  return (
    <>
      <mesh receiveShadow>
        <planeBufferGeometry
          attach="geometry"
          args={[(fov_y * window.innerWidth) / window.innerHeight, fov_y]}
        />
        <shaderMaterial
          attach="material"
          transparent
          uniforms={uniforms}
          fragmentShader={fragmentShader}
        />
      </mesh>
      <ambientLight intensity={1} />
    </>
  );
};

const Background = memo((props: {}) => {
  const theme = useTheme();
  const ContextBridge = useContextBridge();
  return (
    <Box
      position="absolute"
      left={0}
      top={0}
      width={`100vw`}
      height={`100vh`}
      sx={{
        minHeight: "100vh",
        borderRadius: 2,
        overflow: "hidden",
        backgroundImage: fradient({
          seed: "fd289fnd2d90fm29",
          hueRange: [190, 220],
          saturationRange: [0.4, 0.5],
          lightnessRange: [0.1, 0.3],
        }),
      }}
    >
      {/*
      <Canvas dpr={[1, 1]}>
        <ContextBridge>
          <Suspense fallback="">
            <TestScene />
          </Suspense>
        </ContextBridge>
      </Canvas>
      */}
    </Box>
  );
});

export default Background;
