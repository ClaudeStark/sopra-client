import process from "process";
import { isProduction } from "@/utils/environment";
/**
 * Returns the API base URL based on the current environment.
 * In production it retrieves the URL from NEXT_PUBLIC_PROD_API_URL (or falls back to a hardcoded url).
 * In development, it returns "http://localhost:8080".
 */
/*export function getApiDomain(): string {
  const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL ||
    "https://api.guessbb.claudestark.ch"; // TODO: update with your production URL as needed.
  const devUrl = "http://localhost:8080";
  return isProduction() ? prodUrl : devUrl;
}*/

export function getApiDomain(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return process.env.NEXT_PUBLIC_PROD_API_URL || "https://api.guessbb.claudestark.ch";
  }
  return "http://localhost:8080";
}
