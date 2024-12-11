const Username = document.getElementById("Username");
const RoomCode = document.getElementById("RoomCode");
const btn = document.getElementById("btn");
const errorSpan = document.getElementById("error");
const input = document.getElementById("textBox");
const button = document.getElementById("dropdown-btn");
const list = document.getElementById("dropdown-list");
const items = document.querySelectorAll(".dropdown-item");
let chooseitems = false;

function validatePlayerNames() {  
  const Name = Username.value;
  const Code = RoomCode.value;

  // Check if username or room code is empty
  if (!Name) {
    errorSpan.textContent = "Please enter a valid username.";
    Username.focus(); // Focus on the username input
    return false;
  }

  // Check for valid characters in username and room code
  if (!/^[a-zA-Z]+$/.test(Name)) {
    errorSpan.textContent = "Username must contain only alphabetic characters.";
    Username.focus(); // Focus on the username input
    return false;
  }

  // Check if a dropdown option has been selected
  if (!chooseitems) {
    errorSpan.textContent = "Please choose an option (Join Room or Create Room).";
    return false;
  }

  // Check if room code is empty
  if (!Code) {
    errorSpan.textContent = "Please enter a valid room code.";
    RoomCode.focus(); // Focus on the room code input
    return false;
  }


  if (!/^[a-zA-Z]+$/.test(Code)) {
    errorSpan.textContent = "Room code must contain only alphabetic characters (A-Z).";
    RoomCode.focus(); // Focus on the room code input
    return false;
  }


  // Clear the error and proceed
  errorSpan.textContent = "";
  window.location.href = "game.html"; // Redirect to game page
  return true;
}

// Attach the validation function to the button
btn.addEventListener("click", validatePlayerNames);

function initDropdown() {
  // Toggle dropdown visibility
  function toggleDropdown(event) {
    event.preventDefault();
    const isVisible = list.classList.contains("visible");
    closeAllDropdowns();
    if (!isVisible) {
      list.classList.add("visible");
      button.classList.add("open");
    }
  }

  // Close dropdown
  function closeDropdown() {
    list.classList.remove("visible");
    button.classList.remove("open");
  }

  // Handle item selection
  function selectItem(event) {
    event.preventDefault();
    const selectedItem = event.target;
    chooseitems = true;
    button.textContent = selectedItem.textContent;
    button.dataset.value = selectedItem.dataset.value;

    // Update placeholder text based on dropdown choice
    RoomCode.placeholder = button.dataset.value === "1" 
      ? "Enter Room Code" 
      : "Create Room Code";
    
    closeDropdown();
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
  button.addEventListener("click", toggleDropdown);
  items.forEach((item) => item.addEventListener("click", selectItem));

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
