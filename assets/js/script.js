$(function(){
	var filemanager = $('.filemanager'),
		breadcrumbs = $('.breadcrumbs'),		
		fileList = filemanager.find('.data');
	// Recuperar los archivos los datos del archivo scan.php con AJAX
	$.get('scan.php', function(data) {
		var response = [data],
			currentPath = '',
			breadcrumbsUrls = [];
		var folders = [],
			files = [];
		// Este evento monitorea los cambios en la URL. Permite ir hacia atras/adelante.
		$(window).on('hashchange', function(){
			goto(window.location.hash);
			// Permite cargar la pagina para mostrar la carpeta seleccionada
		}).trigger('hashchange');
		// Oculta y muestra el cuadro de busqueda
		filemanager.find('.search').click(function(){
			var search = $(this);
			search.find('span').hide();
			search.find('input[type=search]').show().focus();
		});
		// Detecta escritura en el cuadro de busqueda, busca al instante
		filemanager.find('input').on('input', function(e){
			folders = [];
			files = [];
			var value = this.value.trim();
			if(value.length) {
				filemanager.addClass('searching');
				// Actualiza el #hash con cada entrada de teclado
				window.location.hash = 'search=' + value.trim();				
			}
			else {
				filemanager.removeClass('searching');
				window.location.hash = encodeURIComponent(currentPath);
			}
		}).on('keyup', function(e){
			// Presionando "ESC" o click fuera del cuadro, se cancela la busqueda ** No esta funcionando, ya que se desactivo el hide del cuadro
			var search = $(this);
			if(e.keyCode == 27) {
				search.trigger('focusout');
			}
		}).focusout(function(e){
			// Cancela la busqueda
			var search = $(this);
			if(!search.val().trim().length) {
				window.location.hash = encodeURIComponent(currentPath);
				// search.hide();
				search.parent().find('span').show();
			}
		});
		// Click en las carpetas
		fileList.on('click', 'td.folders', function(e){
			e.preventDefault();
			var nextDir = $(this).find('a.folders').attr('href');
			if(filemanager.hasClass('searching')) {
				// Construye las migas de pan * breadcrumbs
				breadcrumbsUrls = generateBreadcrumbs(nextDir);
				filemanager.removeClass('searching');
				filemanager.find('input[type=search]').val('').hide();
				filemanager.find('span').show();
			}
			else {
				breadcrumbsUrls.push(nextDir);
			}
			window.location.hash = encodeURIComponent(nextDir);
			currentPath = nextDir;
			// location = window.location.href;
			// window.location.reload(true);
			// setTimeout(window.location.reload(true),0001);
			// setTimeout(window.location.reload.bind(window.location),1);
			// document.location.reload(true);
		});
		// Click en miga de pan * breadcrumbs
		breadcrumbs.on('click', 'a', function(e){
			e.preventDefault();
			var index = breadcrumbs.find('a').index($(this)),
				nextDir = breadcrumbsUrls[index];
			breadcrumbsUrls.length = Number(index);
			window.location.hash = encodeURIComponent(nextDir);
			// location = window.location.href;
			// window.location.reload(true);
			// setTimeout(location.reload(true),0001);
			// setTimeout(window.location.reload.bind(window.location),1);
			// document.location.reload(true);
		});
		// Navega hacia el hash dado (ruta)
		function goto(hash) {
			hash = decodeURIComponent(hash).slice(1).split('=');
			if (hash.length) {
				var rendered = '';
				// Si hash se encuentra en la busqueda
				if (hash[0] === 'search') {
					filemanager.addClass('searching');
					rendered = searchData(response, hash[1].toLowerCase());
					if (rendered.length) {
						currentPath = hash[0];
						render(rendered);
					}
					else {
						render(rendered);
					}
				}
				// Si hash es una ruta
				else if (hash[0].trim().length) {
					rendered = searchByPath(hash[0]);
					if (rendered.length) {
						currentPath = hash[0];
						breadcrumbsUrls = generateBreadcrumbs(hash[0]);
						render(rendered);
					}
					else {
						currentPath = hash[0];
						breadcrumbsUrls = generateBreadcrumbs(hash[0]);
						render(rendered);
					}
				}
				// Si no hay hash
				else {
					currentPath = data.path;
					breadcrumbsUrls.push(data.path);
					render(searchByPath(data.path));
				}
			}
		}
		// Divide una ruta de archivo y la convierte en ruta de navegacion clickeable breadcrumbs
		function generateBreadcrumbs(nextDir){
			var path = nextDir.split('/').slice(0);
			for(var i=1;i<path.length;i++){
				path[i] = path[i-1]+ '/' +path[i];
			}
			return path;
		}
		// Localiza el archivo por la ruta
		function searchByPath(dir) {
			var path = dir.split('/'),
				demo = response,
				flag = 0;
			for(var i=0;i<path.length;i++){
				for(var j=0;j<demo.length;j++){
					if(demo[j].name === path[i]){
						flag = 1;
						demo = demo[j].items;
						break;
					}
				}
			}
			demo = flag ? demo : [];
			return demo;
		}
		// Busca recursivamente a traves del arbol de archivos
		function searchData(data, searchTerms) {
			data.forEach(function(d){
				if(d.type === 'folder') {
					searchData(d.items,searchTerms);
					if(d.name.toLowerCase().match(searchTerms)) {
						folders.push(d);
					}
				}
				else if(d.type === 'file') {
					if(d.name.toLowerCase().match(searchTerms)) {
						files.push(d);
					}
				}
			});
			return {folders: folders, files: files};
		}
		// Fecha de modificacion
		function formatTimestamp(edit) {
			var m = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
			var d = new Date(edit*1000);
			return [m[d.getMonth()],' ',d.getDate(),', ',d.getFullYear()," ",
				(d.getHours() % 12 || 12),":",(d.getMinutes() < 10 ? '0' : '')+d.getMinutes(),
				" ",d.getHours() >= 12 ? 'PM' : 'AM'].join('');
		}
		// Renderiza el HTML para el administrador de archivos
		function render(data) {
			var scannedFolders = [],
				scannedFiles = [];
			if(Array.isArray(data)) {
				data.forEach(function (d) {
					if (d.type === 'folder') {
						scannedFolders.push(d);
					}
					else if (d.type === 'file') {
						scannedFiles.push(d);
					}
				});
			}
			else if(typeof data === 'object') {
				scannedFolders = data.folders;
				scannedFiles = data.files;
			}
			// Vacia el resultado anterior y crea el nuevo
			fileList.empty().hide();
			if(!scannedFolders.length && !scannedFiles.length) {
				filemanager.find('.nothingfound').show();
			}
			else {
				filemanager.find('.nothingfound').hide();
			}
			if(scannedFolders.length) {
				scannedFolders.forEach(function(f) {
					var itemsLength = f.items.length,
						name = escapeHTML(f.name),
						edit = formatTimestamp(f.edit),
						icon = '<span class="icon folder"></span>';
					if(itemsLength) {
						icon = '<span class="icon folder full"></span>';
					}
					if(itemsLength == 1) {
						itemsLength += ' item';
					}
					else if(itemsLength > 1) {
						itemsLength += ' items';
					}
					else {
						itemsLength = 'Carpeta vacia';
					}
					var folder = $('<tr><td>'+icon+'</td><td class="folders"><a class="folders" title="'+name+'" href="'+f.path+'">'+name+'</a></td><td>'+itemsLength+'</td><td>'+edit+'</td></tr>');
					folder.appendTo(fileList);
				});
			}
			if(scannedFiles.length) {
				scannedFiles.forEach(function(f) {
					var fileSize = bytesToSize(f.size),
						name = escapeHTML(f.name),
						fileType = name.split('.'),
						edit = formatTimestamp(f.edit),
						icon = '<span class="icon file"></span>';
					fileType = fileType[fileType.length-1];
					icon = '<span class="icon file f-'+fileType+'">.'+fileType+'</span>';
					var file = $('<tr><td>'+icon+'</td><td class="files"><a class="files" download title="'+name+'" href="'+f.path+'">'+name+'</a></td><td>'+fileSize+'</td><td>'+edit+'</td></tr>');
					file.appendTo(fileList);
				});
			}
			// Genera la miga de pan breadcrumbs
			var url = '';
			if(filemanager.hasClass('searching')){
				url = '<span>Resultado de busqueda: </span>';
				fileList.removeClass('animated');
			}
			else {
				fileList.addClass('animated');
				breadcrumbsUrls.forEach(function (u, i) {
					var name = u.split('/');
					if (i !== breadcrumbsUrls.length - 1) {
						url += '<a id="link" href="'+u+'"><span class="folderName">' + name[name.length-1] + '</span></a> <span class="arrow">/</span> ';
					}
					else {
						url += '<span class="folderName">' + name[name.length-1] + '</span>';
					}
				});
			}
			breadcrumbs.text('').append(url);
			// Mostrar los elementos generados
			fileList.animate({'display':'inline-block'});
		}		
		// Esta función escapa de los caracteres html especiales en los nombres
		function escapeHTML(text) {
			return text.replace(/\&/g,'&amp;').replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
		}
		// Convierte el tamaño del archivo en bytes a KB GB etc
		function bytesToSize(bytes) {
			var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			if (bytes == 0) return '0 Bytes';
			var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
			return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
		}
		$(document).ready(function() {
		 	$.noConflict();
		    $('#example').DataTable({

		    	// "sDom": 'Rfrtlip'.
		    	// Traduccion al español de DataTable
	    		"language":{
				    "sProcessing":     "Procesando...",
				    "sLengthMenu":     "Mostrar _MENU_ registros",
				    "sZeroRecords":    "No se encontraron resultados",
				    "sEmptyTable":     "Ningún dato disponible en esta tabla",
				    "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
				    "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
				    "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
				    "sInfoPostFix":    "",
				    "sSearch":         "Buscar:",
				    "sUrl":            "",
				    "sInfoThousands":  ",",
				    "sLoadingRecords": "Cargando...",
				    "oPaginate": {
				        "sFirst":    "Primero",
				        "sLast":     "Último",
				        "sNext":     "Siguiente",
				        "sPrevious": "Anterior"
				    },
				    "oAria": {
				        "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
				        "sSortDescending": ": Activar para ordenar la columna de manera descendente"
				    }
				}
	    	});	    	
		});		
		// var getDiv = document.getElementsByClassName("ui stackable grid");
		// var div = "<div class='filemanager'><div class='breadcrumbs' id='migas'></div></div>"
		// getDiv.appendChild(div);

	});

});