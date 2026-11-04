import axios from "axios";
import { appConfig } from "@/constants/config";

if (!appConfig.apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured before making API requests.");
}

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
});
