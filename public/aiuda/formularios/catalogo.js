function cargar(item) {
    // Obtener los datos del producto seleccionado
    const imgSrc = item.querySelector("img").src;
    // const descripcionProducto = item.querySelector(".descripcion").textContent;
    const nombreProducto = item.getAttribute("data-nombre");
    

    // Actualizar el contenido del contenedor de selección
    document.getElementById("img").src = imgSrc;
    // document.getElementById("descripcion").textContent = descripcionProducto;
    document.getElementById("modelo").textContent = nombreProducto;
    

    // Mostrar el contenedor de selección
    const seleccion = document.getElementById("seleccion");
    mostrador.style.width = "65%";
    seleccion.style.width = "40%";
    seleccion.style.opacity = "1";
    

}

function cerrar(){
    mostrador.style.width = "100%";
    seleccion.style.width = "0%";
    seleccion.style.opacity = "0";
    quitarBordes();
}
function quitarBordes(){
    var items = document.getElementsByClassName("item");
    for(i=0;i <items.length; i++){
        items[i].style.border = "none";
    }
}