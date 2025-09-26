import { useState, useEffect, useRef } from "react";
import { useCall } from "@stream-io/video-react-sdk";

export const useStreamMediaStream = () => {
  const call = useCall();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const mediaStream = call?.camera.state.mediaStream;
    if (!mediaStream) {
      return;
    }

    const createVideoFromStream = async () => {
      try {

        const video = document.createElement("video");
        video.srcObject = mediaStream as MediaStream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.style.display = "none";
        video.setAttribute("data-engagement-video", "true");

        document.body.appendChild(video);
        videoRef.current = video;

        // Wait for video to be ready
        const handleLoadedMetadata = () => {
          setVideoElement(video);
        };

        if (video.readyState >= 1) {
          handleLoadedMetadata();
        } else {
          video.addEventListener("loadedmetadata", handleLoadedMetadata, {
            once: true,
          });
        }

        try {
          await video.play();
        } catch (playError) {
          console.warn("Video play failed, but continuing:", playError);
          setVideoElement(video);
        }
      } catch (error) {
        console.error("Error creating video from stream:", error);
      }
    };

    createVideoFromStream();

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
      setVideoElement(null);
    };
  }, [call?.camera.state.mediaStream]);

  useEffect(() => {
    const cameraStatus = call?.camera.state.status;
    if (cameraStatus !== "enabled" && videoElement) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
      setVideoElement(null);
    }
  }, [call?.camera.state.status, videoElement]);

  return { videoElement };
};
