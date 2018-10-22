<?php
// directorio a reccorer
$dir = "Archivos"; 
$response = scan($dir);
// Funcion que recorre directorios y archivos, guardando en array multidimensional
function scan($dir){
	$files = array();
	// Comprobar si es un archivo o carpeta
	if(file_exists($dir)){	
		foreach(scandir($dir) as $f) {		
			if(!$f || $f[0] == '.') {
				continue; // Ignora archivos ocultos
			}
			if(is_dir($dir . '/' . $f)) {
				// La ruta es una carpeta
				$files[] = array(
					"name" => $f,
					"type" => "folder",
					"path" => $dir . '/' . $f,
					"edit" => filemtime($dir . '/' . $f), // Recupera la fecha de ultima modificacion
					"items" => scan($dir . '/' . $f) // Recursividad, vuelve a escanear en una carpeta creando un array multidimensional
				);
			}			
			else {
				// Es un archivo
				$files[] = array(
					"name" => $f,
					"type" => "file",
					"path" => $dir . '/' . $f,
					"edit" => filemtime($dir . '/' . $f),
					"size" => filesize($dir . '/' . $f) // Obtiene el tamaño del archivo
				);
			}
		}	
	}
	return $files;
}

// Retorna la representación JSON del valor dado
header('Content-type: application/json');
echo json_encode(array(
	"name" => "Archivos",
	"type" => "folder",
	"path" => $dir,
	"items" => $response
));
?>
