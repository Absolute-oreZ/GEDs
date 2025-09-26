import { useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

export const useFeatureExtractor = () => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadModel = async () => {
    if (faceLandmarkerRef.current) return;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    const faceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );

    faceLandmarkerRef.current = faceLandmarker;
    setIsLoaded(true);
  };

  const processFrame = (
    video: HTMLVideoElement,
    debugDraw: boolean = false
  ): number[] | null => {
    const faceLandmarker = faceLandmarkerRef.current;
    if (!faceLandmarker) {
      console.warn("FaceLandmarker not loaded");
      return null;
    }

    const isVideoReady =
      video &&
      video.readyState >= 2 &&
      !video.paused &&
      !video.ended &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;

    if (!isVideoReady) {
      return null;
    }

    try {
      const now = performance.now();
      const result: FaceLandmarkerResult = faceLandmarker.detectForVideo(
        video,
        now
      );
      const landmarks = result?.faceLandmarks?.[0];

      if (!landmarks || landmarks.length === 0) {
        return null;
      }

      // --- Landmark groups (should match training script) ---
      const leftEyeIndices = [384, 385, 386, 387, 388, 362];
      const rightEyeIndices = [159, 160, 161, 158, 157, 133];
      const mouthIndices = [
        0, 267, 269, 270, 409, 306, 375, 321, 405, 314, 17, 84, 181, 91, 146,
      ];
      const leftEyebrowIndices = [70, 63, 105, 66, 107];
      const rightEyebrowIndices = [336, 296, 334, 293, 300];
      const headPoseIndices = [1, 152, 263, 33, 61, 291];

      const getCoords = (indices: number[]) =>
        indices.map((i) => [landmarks[i].x, landmarks[i].y]);

      const euclidean = (a: number[], b: number[]) =>
        Math.hypot(a[0] - b[0], a[1] - b[1]);

      const EAR = (eye: number[][]) => {
        if (eye.length < 6) return 0;
        const A = euclidean(eye[1], eye[5]);
        const B = euclidean(eye[2], eye[4]);
        const C = euclidean(eye[0], eye[3]);
        return C === 0 ? 0 : (A + B) / (2.0 * C);
      };

      const MOR = (mouth: number[][]) => {
        if (mouth.length < 15) return 0;
        const top = mouth[13];
        const bottom = mouth[14];
        const left = mouth[0];
        const right = mouth[5];
        const horizontalDist = euclidean(left, right);
        return horizontalDist === 0
          ? 0
          : euclidean(top, bottom) / horizontalDist;
      };

      const eyebrowToEyeDist = (eyebrow: number[][], eye: number[][]) => {
        if (!eyebrow.length || !eye.length) return 0;
        const distances = eyebrow.map((eb) =>
          Math.min(...eye.map((e) => Math.abs(eb[1] - e[1])))
        );
        return distances.reduce((a, b) => a + b, 0) / distances.length;
      };

      const headPose = (indices: number[]) => {
        const points = getCoords(indices);
        if (points.length !== 6) return [0, 0, 0];
        const [nose, chin, rightEye, leftEye, rightMouth, leftMouth] = points;
        const dx = rightEye[0] - leftEye[0];
        const dy = nose[1] - chin[1];
        const pitch = dy;
        const yaw = dx;
        const roll = rightMouth[1] - leftMouth[1];
        return [pitch, yaw, roll];
      };

      const leftEye = getCoords(leftEyeIndices);
      const rightEye = getCoords(rightEyeIndices);
      const mouth = getCoords(mouthIndices);
      const leftEyebrow = getCoords(leftEyebrowIndices);
      const rightEyebrow = getCoords(rightEyebrowIndices);

      const features: number[] = [
        (EAR(leftEye) + EAR(rightEye)) / 2,
        MOR(mouth),
        (eyebrowToEyeDist(leftEyebrow, leftEye) +
          eyebrowToEyeDist(rightEyebrow, rightEye)) /
          2,
        ...headPose(headPoseIndices),
      ];

      // --- Debug drawing ---
      if (debugDraw && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "red";
          const drawIndices = [
            ...leftEyeIndices,
            ...rightEyeIndices,
            ...mouthIndices,
            ...leftEyebrowIndices,
            ...rightEyebrowIndices,
            ...headPoseIndices,
          ];
          for (const i of drawIndices) {
            const x = landmarks[i].x * canvas.width;
            const y = landmarks[i].y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      const isValid =
        features.length === 6 &&
        features.every((f) => !isNaN(f) && isFinite(f));
      return isValid ? features : null;
    } catch (err) {
      console.error("Error in processFrame:", err);
      return null;
    }
  };

  return {
    isMediaPipeModelLoaded: isLoaded,
    loadModel,
    processFrame,
    canvasRef,
  };
};
