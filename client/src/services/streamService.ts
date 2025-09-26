import type { NewChannelType } from "@/components/NewChannel";
import { apiRequest } from "../clients/apiClient";

export const fetchStreamToken = async () => {
  const res = await apiRequest("/stream/token");
  if (!res.ok) throw new Error("Failed to fetch user data");
  return res.text();
};

export const createNewChannel = async (values: NewChannelType) => {
  const formData = new FormData();
  formData.append("channelName", values.channelName);

  if (values.channelIcon && values.channelIcon instanceof File) {
    formData.append("channelIcon", values.channelIcon);
  }

  await apiRequest("/channels/new", {
    method: "POST",
    body: formData,
  });
};
