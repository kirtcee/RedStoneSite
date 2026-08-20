// utils/menuItems.js

const menuItems = {
  pizzas: [
    {
      id: "build-your-own",
      name: "Build Your Own Pizza",
      description: "Create your perfect pizza with fresh ingredients",
      sizes: ["Small 10″", "Medium 12″", "Large 14″", "XL 16″"],
      basePrices: {
        "Small 10″": 10.99,
        "Medium 12″": 12.99,
        "Large 14″": 14.99,
        "XL 16″": 17.99,
      },
      toppings: ["Pepperoni", "Mushroom", "Green Pepper", "Onion", "Extra Cheese"],
      pricePerTopping: 1.5,
    },
    // Specialty pizzas
    {
      id: "deluxe",
      name: "Deluxe",
      description: "Pepperoni, Green Peppers, Mushrooms",
      price: 13.99,
    },
    {
      id: "meat-lover",
      name: "Meat Lover",
      description: "Pepperoni, Hot Italian Sausage, Bacon Bits",
      price: 13.99,
    },
    {
      id: "veggie-lover",
      name: "Veggie Lover",
      description: "Mushrooms, Green Peppers, Red Onions",
      price: 13.99,
    },
    {
      id: "canadian",
      name: "Canadian",
      description: "Pepperoni, Real Bacon, Mushrooms",
      price: 13.99,
    },
    {
      id: "hawaiian",
      name: "Hawaiian",
      description: "Pineapple, Ham, Bacon Bits",
      price: 13.99,
    },
    {
      id: "mexican",
      name: "Mexican",
      description: "Red Onions, Jalapenos, Mild Sausage, Tomato",
      price: 13.99,
    },
    {
      id: "greek",
      name: "Greek",
      description: "Black Olives, Feta Cheese, Tomato, Red Onions",
      price: 13.99,
    },
    {
      id: "bourbon-chicken",
      name: "Bourbon Chicken",
      description: "BBQ Base, Bourbon Chicken, Red Onion, Green Peppers",
      price: 15.99,
    },
    {
      id: "shawarma-chicken",
      name: "Shawarma Chicken",
      description: "White Garlic Base, Shawarma Chicken, Pickles, Hot Peppers",
      price: 15.99,
    },
    {
      id: "curry-chicken",
      name: "Curry Chicken",
      description: "White Base, Curry Chicken, Pineapple, Green Pepper, Red Onion",
      price: 15.99,
    },
  ],

  wings: [
    {
      id: "12-wings",
      name: "12 Wings",
      price: 15.99,
    },
    {
      id: "20-wings",
      name: "20 Wings",
      price: 25.99,
    },
    {
      id: "30-wings",
      name: "30 Wings",
      price: 38.99,
    },
  ],

  combos: [
    {
      id: "combo-small",
      name: "Single Combo – Small Pizza + 10 Wings + 1 Dip",
      price: 25.99,
    },
    {
      id: "combo-medium",
      name: "Single Combo – Medium Pizza + 15 Wings + 1 Dip",
      price: 33.99,
    },
    {
      id: "combo-large",
      name: "Single Combo – Large Pizza + 20 Wings + 1 Dip",
      price: 40.99,
    },
    // Add double and family combos later
  ],

  sides: [
    { id: "garlic-bread", name: "Garlic Bread", price: 4.5 },
    { id: "fries", name: "Fries", price: 3.5 },
    { id: "poutine", name: "Poutine", price: 6 },
    { id: "onion-rings", name: "Onion Rings", price: 4.5 },
  ],

  drinks: [
    {
      id: "soda-can",
      name: "Can of Soda",
      options: ["Coke", "Pepsi", "Sprite", "Ginger Ale"],
      price: 1.5,
    },
  ],

  dips: [
    { id: "dip-ranch", name: "Ranch Dip", price: 0.99 },
    { id: "dip-bbq", name: "BBQ Dip", price: 0.99 },
    { id: "dip-blue-cheese", name: "Blue Cheese Dip", price: 0.99 },
  ],
};

export default menuItems;
