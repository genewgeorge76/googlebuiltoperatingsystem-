import React, { createContext, useContext, useState, useEffect } from "react";

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const OSContext = createContext();

export function OSProvider({ children }) {
  const [bids, setBids] = useStickyState([], "worden-bids");
  const [trucks, setTrucks] = useStickyState(
    [{ id: 1, name: "Truck 1 — F-350", capacity: 5, status: "available", lat: 37.38, lng: -77.45 }],
    "worden-trucks"
  );
  const [crews, setCrews] = useStickyState(
    [{ id: 1, name: "Crew Alpha", lead: "Mike", size: 4, status: "ready" }],
    "worden-crews"
  );
  const [jobs, setJobs] = useStickyState(
    [{ id: 1, name: "Food Lion #2118", address: "Chester VA", sqft: 3000, status: "pending", priority: "high" }],
    "worden-dispatch-jobs"
  );
  
  // Expose global actions for Jarvis
  const dispatchTruck = (truckId, jobId) => {
    setTrucks((prev) => prev.map((t) => (t.id === truckId ? { ...t, status: "dispatched" } : t)));
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "active" } : j)));
  };

  const addJob = (job) => {
    setJobs((prev) => [...prev, { id: Date.now(), ...job, status: "pending" }]);
  };

  const addBid = (bid) => {
    setBids((prev) => [...prev, { id: Date.now(), ...bid }]);
  };

  return (
    <OSContext.Provider value={{ bids, setBids, trucks, setTrucks, crews, setCrews, jobs, setJobs, dispatchTruck, addJob, addBid }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  return useContext(OSContext);
}
