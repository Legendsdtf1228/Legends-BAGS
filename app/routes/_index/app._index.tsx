import { useState } from "react";

export default function AppIndex() {
  const [image, setImage] = useState<string | null>(null);
  const [color, setColor] = useState("white");
  const [location, setLocation] = useState("front");

  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Legends Shirt Builder</h1>

      <input type="file" onChange={handleUpload} />

      <br /><br />

      <label>Print Location</label>
      <select onChange={(e) => setLocation(e.target.value)}>
        <option value="front">Front</option>
        <option value="back">Back</option>
        <option value="sleeve">Sleeve</option>
      </select>

      <br /><br />

      <label>Shirt Color</label>
      <select onChange={(e) => setColor(e.target.value)}>
        <option>white</option>
        <option>black</option>
        <option>red</option>
        <option>blue</option>
      </select>

      <br /><br />

      <div
        style={{
          width: 300,
          height: 350,
          background: color,
          position: "relative",
          border: "2px solid black",
          borderRadius: 12
        }}
      >
        {image && (
          <img
            src={image}
            style={{
              width: 150,
              position: "absolute",
              top: location === "front" ? "120px" :
                   location === "back" ? "150px" : "40px",
              left: "75px"
            }}
          />
        )}
      </div>
    </div>
  );
}