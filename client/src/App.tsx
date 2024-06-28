import React, { useEffect, useState } from "react";
import "./styles.css";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string>("");

  useEffect(() => {
    getData();
  }, []);

  // API call to GET data
  const getData = async () => {
    const response = await fetch(API_URL);
    const { data } = await response.json();
    setData(data);
  };

  // API call to Update Data
  const updateData = async () => {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    await getData();
  };

  // API call to verify Data
  const verifyData = async () => {
    const response = await fetch(`${API_URL}/verify`, {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    // Show alert if data is tampered or not
    if (result.valid) {
      alert("Data is valid and untampered.");
    } else {
      alert("Data has been tampered with.");
    }
  };

  return (
    <div className="container">
      <div className="saved-data">Saved Data: {data}</div>
      <input
        className="input-box"
        type="text"
        // value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <div className="button-container">
        <button className="button" onClick={updateData}>
          Update Data
        </button>
        <button className="button" onClick={verifyData}>
          Verify Data
        </button>
      </div>
    </div>
  );
}

export default App;
