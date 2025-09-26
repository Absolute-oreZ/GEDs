// Update your useEngagementModel hook with these optimizations

import { useState } from "react";
import * as tf from "@tensorflow/tfjs";

export const useEngagementModel = () => {
  const means = [
    2.63725628, 0.24754904, 20.03774123, 11.40487964, 7.34959163, 80.09556415,
  ];
  const stds = [
    0.188024464, 0.0581533575, 5.7703738, 83.9637132, 48.9170912, 11.3629599,
  ];
  const MODEL_URL = "model/model.json"
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  const loadModel = async () => {
    if (model) return;
    const loadedModel = await tf.loadLayersModel(MODEL_URL);
    setModel(loadedModel);
  };

  const preprocess = (input: number[][]) => {
    const processed = input.map((frame) =>
      frame.map((value, i) => (value - means[i]) / stds[i])
    );

    return tf.tensor([processed], [1, 10, 6], "float32");
  };

  const predict = async (input: number[][]): Promise<number> => {
    if (!model) throw new Error("Model not loaded");

    const tensorInput = preprocess(input);

    await tf.nextFrame();

    const output = (await model.predict(tensorInput)) as tf.Tensor;
    const scoreArray = await output.data();
    await tf.nextFrame();
    return scoreArray[0];
  };

  return {
    loadModel,
    predict,
    isEngagementModelLoaded: model !== null,
  };
};
