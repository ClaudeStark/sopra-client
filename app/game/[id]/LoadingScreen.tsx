"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const LoadingScreen: React.FC = () => {
  const router     = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  return (
    <div></div>
  )
};

export default LoadingScreen;