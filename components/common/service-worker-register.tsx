"use client";
import { useEffect } from "react";

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js");
      });
    }
  }, []);
  return null;
};

export default ServiceWorkerRegister;
