const Username = document.getElementById("Username");
const RoomCode = document.getElementById("RoomCode");
const btn = document.getElementById("btn");
const errorSpan = document.getElementById("error");
const input = document.getElementById("textBox");

async function validatePlayerNames() {  // Make the function async
  const Name = Username.value;
  if (!Name) {
    errorSpan.textContent = "Player names cannot be empty.";
    return false;
  }

  if (!/^[a-zA-Z]+$/.test(Name)) {
    errorSpan.textContent = "Player names must contain only alphabetic characters.";
    return false;
  }
  errorSpan.textContent = "";
  window.location.href = "game.html"
}

btn.addEventListener('click', validatePlayerNames);

function initDropdown() {
  const button = document.getElementById("dropdown-btn");
  const list = document.getElementById("dropdown-list");
  const items = document.querySelectorAll(".dropdown-item");

  // Toggle dropdown visibility
  function toggleDropdown(event) {
    event.preventDefault(); // Prevent default behavior
    const isVisible = list.classList.contains("visible");
    closeAllDropdowns(); // Close other dropdowns
    if (!isVisible) {
      list.classList.add("visible");
      button.classList.add("open"); // Add class for styling
    }
  }

  // Close dropdown
  function closeDropdown() {
    list.classList.remove("visible");
    button.classList.remove("open"); // Remove open class
  }

  // Handle item selection
  function selectItem(event) {
    event.preventDefault(); // Prevent default behavior
    const selectedItem = event.target;
    button.textContent = selectedItem.textContent; // Update button text
    button.dataset.value = selectedItem.dataset.value; // Set selected value
    closeDropdown(); // Close dropdown after selection
  }

  // Close all dropdowns
  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach((dropdown) => {
      dropdown.classList.remove("visible");
    });
    document.querySelectorAll(".dropdown-btn").forEach((btn) => {
      btn.classList.remove("open");
    });
  }

  // Event listeners
  button.addEventListener("click", toggleDropdown); // Toggle dropdown on button click
  items.forEach((item) => item.addEventListener("click", selectItem)); // Add event listeners to each dropdown item

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!button.contains(event.target) && !list.contains(event.target)) {
      closeDropdown();
    }
  });
}

// Initialize the dropdown
document.addEventListener("DOMContentLoaded", () => {
  initDropdown();
});

