import process from "process";
import { isProduction } from "@/utils/environment";
/**
 * Returns the API base URL based on the current environment.
 * In production it retrieves the URL from NEXT_PUBLIC_PROD_API_URL (or falls back to a hardcoded url).
 * In development, it returns "http://localhost:8080".
 */
export function getApiDomain(): string {
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PROD URL:", process.env.NEXT_PUBLIC_PROD_API_URL);
  const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL ||
    "https://api.guessbb.claudestark.ch"; // TODO: update with your production URL as needed.
  const devUrl = "http://localhost:8080";
  return isProduction() ? prodUrl : devUrl;
}
