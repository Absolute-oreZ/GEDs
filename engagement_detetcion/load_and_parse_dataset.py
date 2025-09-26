import os
import pandas as pd


def load_labels(label_file_path):
    df = pd.read_csv(label_file_path)
    df = df[["ClipID", "Engagement"]]
    df.columns = ["clip_id", "engagement_class"]
    return df


def load_clip_list(txt_file_path):
    with open(txt_file_path, "r") as f:
        clips = [line.strip() for line in f.readlines()]
    return clips


def get_dataset(clips_list, label_df, base_path="DataSet/Train"):
    data = []
    for rel_path in clips_list:
        clip_filename = os.path.basename(rel_path)
        clip_filename_witout_extension = clip_filename.split(".")[0]
        user = clip_filename_witout_extension[:6]
        row = label_df[label_df["clip_id"] == clip_filename]
        if not row.empty:
            label = int(row["engagement_class"].values[0])
            full_path = os.path.join(
                base_path, user, clip_filename_witout_extension, rel_path
            )
            data.append((full_path, label))
    return data
