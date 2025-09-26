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
    // predictDummyData(loadedModel);
    setModel(loadedModel);
  };

  const predictDummyData = async (model: tf.LayersModel) => {
    const features = [
      [
        2.865311748408236, 0.39109239140905444, 18.716470588235293,
        -73.88729089812254, -37.91084402303795, 82.27758130891773,
      ],
      [
        2.9430806860936904, 0.35615942723616756, 18.243529411764705,
        -73.56409516484506, -38.12942421990044, 82.3079334453065,
      ],
      [
        2.8527616104593028, 0.33531578046353205, 18.706764705882353,
        -73.62372742139394, -38.10812946858627, 82.17537540157358,
      ],
      [
        2.9734538937792694, 0.34586239972793514, 18.61279411764706,
        -73.6345211120988, -37.88690737859908, 82.14191379415033,
      ],
      [
        2.8731337749049506, 0.3718298054739184, 18.808161764705883,
        -73.81064812732185, -38.10125725479948, 82.46844475022121,
      ],
      [
        3.168404868293236, 0.3722277139558728, 19.08014705882353,
        -76.43992053924995, -38.07443081615726, 80.40806790007616,
      ],
      [
        3.069661598653577, 0.4186937800561624, 18.310220588235293,
        -74.92967353749857, -38.57652290856742, 80.38023895459088,
      ],
      [
        2.9529664793193318, 0.3240170583450436, 18.73235294117647,
        -74.57058473380702, -38.39062417787942, 81.17711323647708,
      ],
      [
        2.8647370254082625, 0.33876148617699864, 18.319558823529412,
        -74.07459228918448, -38.27728896746615, 80.68654890792304,
      ],
      [
        2.9314539353856093, 0.35690381263991916, 18.444485294117648,
        -74.10188531258082, -37.8555051303595, 79.81309095188206,
      ],
    ];

    const tensorInput = preprocess(features);

    const output = (await model.predict(tensorInput)) as tf.Tensor;
    const probabilities = await output.data();
    console.log("predicting dummy data:");
    console.log({ probabilities });

    tf.dispose([tensorInput, output]);
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
