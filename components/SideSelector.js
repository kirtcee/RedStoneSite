import React from "react";

const sideItems = [
  {
    name: "French Fries",
    image: "/images/sides/fries.jpg",
    description: "Crispy golden fries, available in Regular or Large."
  },
  {
    name: "Poutine",
    image: "/images/sides/poutine.jpg",
    description: "Classic poutine with cheese curds and rich gravy."
  },
  {
    name: "Shawarma Poutine",
    image: "/images/sides/shawarma-poutine.jpg",
    description: "Poutine topped with spiced chicken shawarma and optional hot sauce drizzle."
  },
  {
    name: "Cheesy Garlic Bread",
    image: "/images/sides/cheesy-garlic-bread.jpg",
    description: "Fresh baked garlic bread loaded with melted cheese."
  },
  {
    name: "Garlic Bread",
    image: "/images/sides/garlic-bread.jpg",
    description: "Toasted garlic bread with herbs and butter."
  },
  {
    name: "Onion Rings",
    image: "/images/sides/onion-rings.jpg",
    description: "Crunchy onion rings with your choice of portion size."
  }
];

export default function SideSelector({ onSelect }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Choose a Side</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem"
        }}
      >
        {sideItems.map((item) => (
          <div
            key={item.name}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />
            <div style={{ padding: "1rem", flex: "1" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>{item.name}</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#555" }}>{item.description}</p>
              <button
                onClick={() => onSelect(item.name)}
                style={{
                  backgroundColor: "#E91E28",
                  color: "white",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  width: "100%",
                  cursor: "pointer"
                }}
              >
                Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
