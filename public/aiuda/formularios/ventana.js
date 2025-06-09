document.addEventListener("DOMContentLoaded", function () {
  const openButtons = document.querySelectorAll(".open-button");
  const closeButtons = document.querySelectorAll(".close-button");

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const ventanaContenedor = button.nextElementSibling;
      ventanaContenedor.classList.add("show");
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const ventanaContenedor = button.closest(".ventana_contenedor");
      ventanaContenedor.classList.remove("show");
    });
  });
});