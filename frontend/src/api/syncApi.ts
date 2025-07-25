const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const startWatchingForUpdates = async () => {
  const res = await fetch(`${API_BASE_URL}/api/v1/sync/start-watch`, {
    method: "POST",
    credentials: "include",
  });
  const result = await res.json();
  console.log(result);
};
