!(function(window, d3) {

    'use strict';
    

	let url_img= '../../img/';
	let url_data = '../../data/';
	let tree_counter = false;
	let selectValues = null;
	
    window.onload = function() {
	    d3.queue()
		.defer(d3.json, url_data + 'data_final_unicode.json')
		.defer(d3.json, url_data + 'dictionary.json')
		.await(init);

	    
    };
	
	/**** --- FILTERING DATA --- ***/

	
	function filter_data(database, select_val){
		
		//console.log('data to filter TBD', typeof(select_val.ambito), select_val);
		
		let ambito_filter = database.filter(function(d){
			 
				return +d.ambito_id === +select_val.ambito;
		});
		
		let subambito_filter = ambito_filter.filter(function(d){
			
				return +d.subambito_id === +select_val.subambito;
		
		});
		
		let presencia_filter = subambito_filter.filter(function(d){
			
			// console.log(typeof(' d.presencia',  d.presencia)); 
			// --> number
			return +d.presencia === +1;
		});

		//console.log('data ambito_filter', ambito_filter);
		//console.log('data subambito_filter', subambito_filter);
		//console.log('data presencia_filter', presencia_filter);
		return presencia_filter;
		
		
	}// --> end filter_data
	
	
	
	// USED ON TREE NOT IN LIST
	function filter_mejora(data, values){
		
		//console.log('filter_mejora', data, values);
		
		let mejora_filter = data.filter(function(d){
			
			switch(values.mejora){
				case "":
				case "0":
					return d;
					break;
				case "1":
					return d.i_d === 1;
					break;
				case "2":
					return d.produccion === 1;
					break;
				case "3":
					return d.suministro_y_compras === 1;
					break;
				case "4":
					return d.almacenamiento_y_logistica === 1;
					break;
				case "5":
					return d.marketing === 1;
					break;
				case "6":
					return d.ventas === 1;
					break;
				case "7":
					return d.servicios === 1;
					break;
				case "8":
					return d.administracion === 1;
					break;
				default:
					return d;	
			} // --> end swicth
			
			
		});// --> end mejora_filter
		
		return mejora_filter;
		
		
		
		
		
		
		
		
	}
	/**** --- NEST DATA: data nest for tree ***/

	function nest_tree_data(data){
        
        let nested_tree_data = d3.nest()
            .key(function(d) {
                return d.centro;
            })
            //.key(function(d) { return d.capacidad_uno; })
            .key(function(d) {
                return d.capacidad_dos;
            })
            .key(function(d) {
                return d.cod;
            })

            //.rollup(function(v) { return v.length; }) 
            // rollup takes the array of values for each group and it produces a value based on that array
            .entries(data);
        
        return nested_tree_data;     
		
	}
	function nest_list_data (data){
		
		let nested_list_data = d3.nest()
            .key(function(d) {
                return d["cod"];
            })
            .entries(data)
            .sort(function(a,b) { return d3.ascending(a.values[0].capacidad_dos,b.values[0].capacidad_dos); });
            
        return nested_list_data;    
		
		
	}
	
	function get_dictionary_obj(dic, key_to_check, value_to_check){
		//console.log('get_dictionary_property', dic, key_to_check, value_to_check, key_to_return);
		const dic_length = dic.length;
		let i = 0;
		let result = null;
		
		for(i; i<dic_length; i++){
			
			if(dic[i][key_to_check] === value_to_check){
				result = dic[i];
			}
		}
		// console.log('get_dictionary_obj', result);
		return result;
		
		
		
	}

	function get_dictionary_property(dic, key_to_check, value_to_check, key_to_return){
		//console.log('get_dictionary_property', dic, key_to_check, value_to_check, key_to_return);
		const dic_length = dic.length;
		let i = 0;
		let result = null;
		
		for(i; i<dic_length; i++){
			
			if(dic[i][key_to_check] === value_to_check){
				result = dic[i][key_to_return];
			}
		}
		// console.log('get_dictionary_property', result);
		return result;
		
		
	}	
	
	

	
	/**** --- BUILD SELECTS ***/
	
	function build_selects(data, dic){
		
		//console.log('building selects.....');
		const dic_ambitos = dic.industria_4.ambitos;
		const dic_subambitos = dic.industria_4.subambitos;
		const dic_mejoras = dic.mejoras;
		
			const ambito_select = d3.select('#ambito_select').on('change',onchange);
			const subambito_select = d3.select('#subambito_select').on('change',onchange);
			const mejora_select = d3.select('#mejora_select').on('change',onchange_mejora); // now doing nothing! only log values
			
					
			selectValues = null;
			let select_subambito = null;
			let select_mejora = null;

		// console.log('build_selects', ambito_select, subambito_select, mejora_select);
		
		
        function updateSelect() {

                return{

                    ambito: ambito_select.property('selectedOptions')[0].value,
                    subambito: subambito_select.property('selectedOptions')[0].value,
                    mejora: mejora_select.property('selectedOptions')[0].value

                };
            }

		
		function get_industry_obj(id, dic){
			
			//console.log('get_industry_obj', id, dic);
				
				let temp =dic.filter(function(d) { 
					// console.log('d', d.parent_id);
					return d.ambito_id === +id;
					
					});
				// console.log('temp', temp);
				// console.log('get_industry_obj temp', temp);
				return temp;
		}


		function onchange_mejora(){
			
			
			if(!tree_counter){
			
				selectValues = updateSelect();
				draw_result_numbers(results_partial, selectValues, dic_mejoras);
				//console.log('onchange_mejora !tree_counter selectValues', selectValues);

				let ambito_id = this.value; // string
				let option_obj = get_dictionary_obj(dic_mejoras, 'id', +ambito_id);
				let option_name = option_obj.nombre;
				let options_json = option_obj.json; // todas, i_d, produccion...
				// console.log('option_name', option_name);
				let green_stars = d3.selectAll('.star_' + options_json + " i.star-icon--gray");
				// console.log('green_stars', green_stars);
				d3.selectAll('.table-row-parent').classed('mejora_hidden', false);
				
				green_stars.each(function(d, i) { 
					let el = this.parentNode.parentNode.parentNode.parentNode;
					d3.select(el).classed('mejora_hidden', true );
				});			
				// console.log('temp::: ',results_partial, options_name);
				
				d3.selectAll('.mejora_name').html(function(d){
					return option_name;
				});
				
				draw_title_selector(get_the_select_info(selectValues, dic));
				
				return '';
			}
				// SELECT ON CHANGE: TREE
			if(tree_counter){
				selectValues = updateSelect();
				console.log('tree_counter ON CHANGE selectValues', selectValues);
				draw_title_selector(get_the_select_info(selectValues, dic));

				init_overall_tree(data, selectValues, dic);
					
			}// if(tree_counter) ENDS
			
			

		}
		
		
		
		function onchange(){

				//console.log('enter onchange....');
				selectValues = updateSelect();
				select_subambito = selectValues.subambito - 1; 
				//console.log('selectValues',selectValues, select_subambito);
				
				
				if(this.dataset.select === "parent_select" ){
					// console.log('enter onchange parent select....');
					// console.log('this.dataset.select', this.dataset.select);
					// console.log('onchange this.value', this.value);
					let ambito_id = get_industry_obj(this.value, dic_ambitos)[0].ambito_id;
					// console.log('onchange ambito_id', ambito_id);
					let subambito_obj = get_industry_obj(ambito_id, dic_subambitos);
					// console.log('onchange subambito_obj', subambito_obj);
	
					let options = subambito_select
						.selectAll('option')
						.remove()
						.exit()
						.data(subambito_obj)
						.enter()
						.append('option')
						.each(function(d, i){
							//console.log('dd, ii', d, i);
							
							if( d.subambito_id === +select_subambito + 1){
								d3.select(this).attr('selected', 'selected');
							}
						})	
	
						.attr('value', function(d){ 
							//console.log('d.subambito_id', d.subambito_id, d); 
							return d.subambito_id ? d.subambito_id : '';
						})
						.text(function (d) { 
							// console.log('option', d);
							return d.sub_sort_name;
						});
						// console.log('options', options);
					 
				} //  --> if ends
				
			// SELECT ON CHANGE: LIST
			if(!tree_counter){
				//console.log('enter onchange NO TREE....');

				//if(this.dataset.select != "mejora_select" ){
					selectValues = updateSelect();
					select_mejora = +selectValues.mejora;
					select_subambito = +selectValues.subambito;
					//console.log('selectValues   ::: ',selectValues, dic_ambitos, select_subambito);
					
					let temp = filter_data(data, selectValues);
					console.log('temp   ::: ',temp);
					activate_keys();
					// document.getElementById('mejora_select').options[0].selected = 'selected';
					mejora_select.property('value', select_mejora);
					subambito_select.property('value', select_subambito);
					//console.log('mejora_select.property(value)', mejora_select.property('value'), subambito_select.property('value'));
					
					
					draw_table(temp, selectValues, dic);
										
					
					
					
										// filtra los valores que queremos mostrar según el selector de mejoras
					let element = document.getElementById('mejora_select');
					element.dispatchEvent(new Event("change")); 

					
				//}			
					
					
				
				
			} // if(!tree_counter) ENDS
			
			
				// SELECT ON CHANGE: TREE
			if(tree_counter){
				selectValues = updateSelect();
				draw_title_selector(get_the_select_info(selectValues, dic));

				//console.log('tree_counter ON CHANGE selectValues', selectValues);
				init_overall_tree(data, selectValues, dic);
					
			}// if(tree_counter) ENDS
			
			
			
			
			
		} //  --> onChange
		
		
		
		
	}//  --> Build Select

	// activate table keys when selects change
	function activate_keys(){
		
		let the_keys = d3.selectAll('.table-keys--key');
		
		the_keys.each(function(d) {
      		 // console.log(d3.select(this.parentNode.parentNode));
	  		 d3.select(this.parentNode.parentNode).classed("table-key--active", true);
    	});
		
	}

	/********* --- TABLE 4gune: helper functions --- *************
	**************************************************************/
	
		
	/*** --- Check MEJORAS: devuelve un objeto que contabiliza (true or false) si la mejora está presente en la data ---*/
	
	function check_mejoras(data){
		
		// console.log('check_mejoras data', data.values);
		
		let values = data.values;
		let valuesL = values.length;
		let counter = {
			"i_d": {"total": valuesL, "checks": 0, "bool": false },
			"produccion": {"total": valuesL, "checks": 0, "bool": false },
			"suministro_y_compras": {"total": valuesL, "checks": 0, "bool": false },
			"almacenamiento_y_logistica": {"total": valuesL, "checks": 0, "bool": false },
			"marketing": {"total": valuesL, "checks": 0, "bool": false },
			"ventas": {"total": valuesL, "checks": 0, "bool": false },
			"servicios": {"total": valuesL, "checks": 0, "bool": false },
			"administracion":{"total": valuesL, "checks": 0, "bool": false }
		}
		let temp = ["i_d", "produccion", "suministro_y_compras", "almacenamiento_y_logistica","marketing", "ventas", "servicios", "administracion"]; 
		let tempL = temp.length;
		let i = 0;
		let j;
		
		for (i; i < valuesL; i++){
			
					
					
		//if(data.values[i].cod === 25){ console.log('check_mejoras data', data.values[i]);}			

			j = 0;
			
			for (j; j < tempL; j++){
			//console.log('check_mejoras values[temp[j]]', values[i][temp[j]], temp[j]);
				if(values[i][temp[j]] === 1){
					
					counter[temp[j]]['checks']++; 
					
				}
			}
		}
		
		for (var prop in counter) {
		    if (counter.hasOwnProperty(prop)) {
			    // console.log(counter[prop].total);
			    if(counter[prop].total === counter[prop].checks ){ counter[prop].bool = true; }
		    }
		}		
		
		
		//console.log('check_mejoras counter', counter);
		return counter;
		
	}
	
	
	/*** --- Check class to fill star ---*/
	function addClass_to_star(d, val){
		// console.log('addClass_to_star', d);
		let values_counter = check_mejoras(d);
		let theClass = 'star-icon--gray';
		
		if(values_counter[val].bool){
			theClass = 'star-icon--green';
		}
		return theClass;
	}
	
	/*** --- Check web info ---*/
	function checkWebInfo(val){
		//console.log('checkWebInfo',val);
		if(val.indexOf('http') != -1){
			return '<i class="fa">&#xf13d;</i><a href="' + val + '"';
		}else{
			return '<a href="javascript:void(0);" class="hidden"' ;
		}
	}
	
	/*** --- Check email info ---*/
	function getEmailInfo(val){
		// console.log('getEmailInfo',val);
		// <i class="fa">&#xf0e0;</i><span>&nbsp;<a href="mailto:example@example.com?subject=4GUNE Clúster Industria 4.0">Iñaki Vázquez</a> </span>
		
		let email = val.email.trim().replace('(at)', "@");
		let responsable = val.responsable.trim();
		const emailRe = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
		let emailIsOk = emailRe.test(email);
		// console.log('getEmailInfo',email, emailIsOk, responsable);
		
		if(emailIsOk){
			if( responsable && responsable != "NO DISPONIBLE" ){
				return '<i class="fa">&#xf0e0;</i><span>&nbsp;<a href="mailto:' + email + '?subject=4GUNE Clúster Industria 4.0">' + responsable + '</a> </span>';
			}else{
				return '<i class="fa">&#xf0e0;</i><span>&nbsp;<a href="mailto:' + email + '?subject=4GUNE Clúster Industria 4.0">' + 'Contacto' + '</a> </span>';
			}
		}
		if(!emailIsOk){
			if( responsable && responsable != "NO DISPONIBLE" ){
				return '<i class="fa">&#xf0e0;</i><span>&nbsp;' + responsable + '</a> </span>';
			}else{
				return '';
			}			
		}
	}
	function addClass_to_bullet(d){
		//console.log('addClass_to_bullet', d);
		let bullet = 'class="fa">&#xf111;';
		
		switch(d){
			case "Transferencia":
				return 'class="fa redColor">&#xf111;'; // pinta TODOS los títulos en los que exista presencia de alguna mejora.
				break;
			case "Formación":
				return 'class="fa blueColor">&#xf111;';
				break;
			case "Investigación":
				return 'class="fa purpleColor">&#xf111;';
				break;
			case "Instalaciones y equipos":
				return 'class="fa orangeColor">&#xf111;';
				break;
			default:
				return bullet;	
		} // --> end swicth
			

		return bullet;
		
		
	}
	function addAttrDataName_to_row(d){
		//console.log('addAttrDataName_to_row', d);
		
		switch(d){
			case "Transferencia":
				return 'transferencia'; // pinta TODOS los títulos en los que exista presencia de alguna mejora.
				break;
			case "Formación":
				return 'formacion';
				break;
			case "Investigación":
				return 'investigacion';
				break;
			case "Instalaciones y equipos":
				return 'instalaciones_y_equipos';
				break;
			default:
				return '';	
		} // --> end swicth
		
	}
	
	
	
	function get_results_numbers(data){
		// console.log('get_results_numbers', data);
		let dataL = data.length;
		let result_numbers = {
			
			"total": {"total": dataL, "number": 0, "mejoras": { "i_d": 0, "produccion": 0, "suministro_y_compras": 0, "almacenamiento_y_logistica": 0, "marketing": 0,"ventas": 0,"servicios": 0,"administracion":0, "total": 0 } },
			"formacion": {"total": dataL, "number": 0, "mejoras": { "i_d": 0, "produccion": 0, "suministro_y_compras": 0, "almacenamiento_y_logistica": 0, "marketing": 0,"ventas": 0,"servicios": 0,"administracion":0, "total": 0 } },
			"instalaciones_y_equipos": {"total": dataL, "number": 0, "mejoras": { "i_d": 0, "produccion": 0, "suministro_y_compras": 0, "almacenamiento_y_logistica": 0, "marketing": 0,"ventas": 0,"servicios": 0,"administracion":0, "total": 0 } },			
			"investigacion": {"total": dataL, "number": 0, "mejoras": { "i_d": 0, "produccion": 0, "suministro_y_compras": 0, "almacenamiento_y_logistica": 0, "marketing": 0,"ventas": 0,"servicios": 0,"administracion":0, "total": 0 } },			
			"transferencia": {"total": dataL, "number": 0, "mejoras": { "i_d": 0, "produccion": 0, "suministro_y_compras": 0, "almacenamiento_y_logistica": 0, "marketing": 0,"ventas": 0,"servicios": 0,"administracion":0, "total": 0 } }			
		};
		
			
		function count_mejoras_obj(prop, values){
			// console.log('count_mejoras_obj', values);
			let temp_obj = result_numbers[prop].mejoras;
			
			// We are here
			//console.log('temp_val', temp_val);
				for( let p in temp_obj ){
					if (temp_obj.hasOwnProperty(p)) {
							if(values[p] === 1){
								temp_obj[p]++;
								temp_obj["total"]++;
								result_numbers['total']['mejoras'][p]++;
								result_numbers['total']['mejoras']['total']++;
							}
						//console.log('values[p]', values[p], p);
						//temp[p] = 'xxx';
	    			}				
				}
			return temp_obj;
		}
	
			
			
			
		let i = 0;
		
		for(i; i < dataL; i++){
			
			if(data[i].values[0].capacidad_uno){
				
				// console.log('data[i].values[0]', data[i].values[0]);
				
				switch(data[i].values[0].capacidad_uno){
					
					case "Transferencia":
						result_numbers['transferencia']["number"]++; // pinta TODOS los títulos en los que exista presencia de alguna mejora.
						result_numbers['total']["number"]++;
						result_numbers['transferencia'].mejoras = count_mejoras_obj('transferencia', data[i].values[0]);
						break;
					case "Formación":
						result_numbers['formacion']["number"]++;
						result_numbers['total']["number"]++;
						result_numbers['formacion'].mejoras = count_mejoras_obj('formacion', data[i].values[0]);
						break;
					case "Investigación":
						result_numbers['investigacion']["number"]++;
						result_numbers['total']["number"]++;
						result_numbers['investigacion'].mejoras = count_mejoras_obj('investigacion', data[i].values[0]);
						break;
					case "Instalaciones y equipos":
						result_numbers['instalaciones_y_equipos']["number"]++;
						result_numbers['total']["number"]++;
						result_numbers['instalaciones_y_equipos'].mejoras = count_mejoras_obj('instalaciones_y_equipos', data[i].values[0]);
						break;
					default:
						return '';	
				} // --> end swicth
				
			}
			
		}
		
		return result_numbers;
		
	};
	
	
	function draw_result_numbers(d, select_val, dic){
		// console.log('draw_result_numbers', d, select_val, dic);
		
		let temp_option = get_dictionary_property(dic, 'id', +select_val.mejora, 'json')
		// console.log('draw_result_numbers temp_option', temp_option);
		if(temp_option && temp_option === "total"){
			let results_total = d3.select('#results_total').html(d.total.number);
			let results_formacion = d3.select('#results_formacion').html(d.formacion.number);
			let results_transferencia = d3.select('#results_transferencia').html(d.transferencia.number);
			let results_instalaciones_y_equipos = d3.select('#results_instalaciones_y_equipos').html(d.instalaciones_y_equipos.number);
			let results_investigacion = d3.select('#results_investigacion').html(d.investigacion.number);
			
		}
		if(temp_option && temp_option !== "total"){
			let results_total = d3.select('#results_total').html(d.total.mejoras[temp_option]);
			let results_formacion = d3.select('#results_formacion').html(d.formacion.mejoras[temp_option]);
			let results_transferencia = d3.select('#results_transferencia').html(d.transferencia.mejoras[temp_option]);
			let results_instalaciones_y_equipos = d3.select('#results_instalaciones_y_equipos').html(d.instalaciones_y_equipos.mejoras[temp_option]);
			let results_investigacion = d3.select('#results_investigacion').html(d.investigacion.mejoras[temp_option]);
			
		}
	};
	
	function draw_title_selector(select_obj){
		
		d3.select('#title_ambito').html(arguments[0].ambito);
		d3.select('#title_subambito').html(arguments[0].subambito);
		d3.select('#title_mejora').html(arguments[0].mejora);
		//console.log('select_obj', select_obj);
		return '';
		
	}
	






	
	
	function get_the_select_info(values, dic){
		// console.log('get_the_select_info', values, dic);
		let selection = { "ambito": null, "subambito": null, "mejora": null };
		
		let dic_ambitos = dic.industria_4.ambitos;
		let dic_subambitos = dic.industria_4.subambitos;
		let dic_mejoras = dic.mejoras;
		
		selection.ambito = get_dictionary_property(dic_ambitos, "ambito_id", +values.ambito, "ambito");
		selection.subambito = get_dictionary_property(dic_subambitos, "subambito_id", +values.subambito, "subambito");
		selection.mejora = get_dictionary_property(dic_mejoras, "id", +values.mejora, "nombre");
		//console.log('get_the_select_info level_val', selection);
		return selection;
		
		
		
	}
	
	
	let results_partial = null;
	/**** --- DRAW MAIN DIV TABLES  ***/

	function draw_table(data, select_values, dic){
		// data: todos los datos para hacer el nest
		// select_values: los valores seleccionados en los selects - {ambito: "0", subambito: "0", mejora: "6"}  - 
		// dic: el diccionario completo
		
		//console.log('draw_table select_values', data, select_values, dic);
		
		let nested_list_data = nest_list_data(data);
		
		// let nested_list_data_length = nested_list_data.length;	
		
		console.log('draw_table nested_list_data', nested_list_data, nested_list_data.length);
		
		//console.log('draw_table results_partial', results_partial);
		let select_info = get_the_select_info(select_values, dic); 
		
		// let values_counter = check_mejoras(nested_list_data[0]);
		let table_container = d3.select('#table_container');
		
		// actions
		//
		// Global result_partials
		results_partial = get_results_numbers(nested_list_data);
		draw_result_numbers(results_partial, select_values, dic.mejoras);
		
		table_container.selectAll("*").remove().exit();
		
		
		let table_main = table_container
			.selectAll('div')
			.data(nested_list_data)
			.enter()
			.append('div')			
			.attr('class', 'col-sm-12 col-md-6 col-lg-12 table-row-parent')
			.attr('data-name', function(d,i){
				
				return addAttrDataName_to_row(d.values[0].capacidad_uno);
				
			});


				
		table_main
			.html(function(d, i){
				// console.log('d', d);
				
				let titulo_obj = get_dictionary_obj(dic.titulos, "cod", d.values[0].cod);
				let titulo = titulo_obj.titulo;
				let bullet_class = addClass_to_bullet(d.values[0].capacidad_uno);
				let capacidad_dos = d.values[0].capacidad_dos;
				let icon_url = url_img + 'icons/icon-' + get_dictionary_property(dic.direcciones, "direccion_id", d.values[0].direccion_id, "provincia").toLowerCase();
				let centro = d.values[0].centro;
				let email = getEmailInfo(titulo_obj);
				let ubicacion_obj = get_dictionary_obj(dic.direcciones, "direccion_id", d.values[0].direccion_id);
				let ubicacion = ubicacion_obj.direccion + ', ' + ubicacion_obj.cp + ' ' + ubicacion_obj.localidad + ', ' +  ubicacion_obj.provincia;
				let univ_obj = get_dictionary_obj(dic.universidades, "univ_id", d.values[0].univ_id);
				let univ = univ_obj.univ;
				let univ_url = univ_obj.univ_url;
				let univ_logo = url_img + 'univ/'+ univ_obj.univ_short_name;
				let web_info = checkWebInfo(titulo_obj.web);
				let descripcion = titulo_obj.desc;
				
				
				
				return '<div class="table-row table-border--gray padding-box--regular">'+
	                  '<div class="cell type first-child">'+
	                     '<p><i ' + bullet_class + '</i> <span>&nbsp;' + capacidad_dos + '</span></p>'+
	                     '<div class="icon-map-container hidden-mobile">&nbsp;<img class="icon-map" src="' + icon_url+ '.svg" /></div>'+
	                  '</div>'+
	                  '<div class="cell title">'+
	                     '<p class="title-name"><span>' + titulo + '</span></p>'+
	                     '<div class="univ-container">'+
	                        '<div class="univ-name">'+
	                           '<p class="margin-bottom--0"><i class="fa">&#xf19c;</i><span>&nbsp;' + univ + '</span></p>'+
	                           '<p class="margin-bottom--0"><i class="fa">&#xf19d;</i><span>&nbsp;' + centro + '</span></p>'+
	                           '<p class="margin-bottom--0">' + email + '</p>' +
	                           '<p class="hidden-screen"><i class="fa">&#xf041;</i>&nbsp;' + ubicacion + '.</p>'+
	                        '</div>'+
	                        '<div class="univ-logo">'+
	                           '<a href="'+ univ_url + '" target="_blank"><img class="icon-univ-logo" src="' + univ_logo + '-color.png" /></a>'+
	                        '</div>'+
	                     '</div>'+
	                     '<div class="univ-links">'+
	                        '<span class="univ-links-ver hidden-mobile"><i class="fa">&#xf0d7;</i><a href="javascript:void(0);" id="link_' + i + '">&nbsp;Ver más</a></span>'+
	                        '<span class="univ-links-web">' + web_info + ' target="_blank">&nbsp;Sitio web</a></span>'+
	                     '</div>'+
	                  '</div>'+
	                  '<div class="cell star star_i_d"><span class="star-text--container hidden-screen">I+D</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "i_d")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_produccion"><span class="star-text--container hidden-screen">Producción</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "produccion")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_suministro_y_compras"><span class="star-text--container hidden-screen">Suministros y compras</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "suministro_y_compras")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_almacenamiento_y_logistica"><span class="star-text--container hidden-screen">Almacenamiento y logística</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "almacenamiento_y_logistica")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_marketing"><span class="star-text--container hidden-screen">Marketing</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "marketing")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_ventas"><span class="star-text--container hidden-screen">Ventas</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "ventas")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_servicios"><span class="star-text--container hidden-screen">Servicios</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "servicios")  + '">&#xf005;</i></span></div>'+
	                  '<div class="cell star star_administracion"><span class="star-text--container hidden-screen">Administración</span><span class="star-icon--container"><i class="fa star-icon ' + addClass_to_star(d, "administracion")  + '">&#xf005;</i></span></div>'+
	               '</div>'+
	               '<div class="table-outside-section hidden-mobile hidden" id="more_' + i + '">'+
	               		'<p><i class="fa">&#xf0eb;</i>&nbsp;' + select_info.ambito + ' | ' + select_info.subambito + ' | ' + '<span class="mejora_name">' + select_info.mejora + '</span></p>'+
		               '<p>' + descripcion + '</p>'+
		               '<p><i class="fa">&#xf041;</i>&nbsp;' + ubicacion + '.</p>'+
		               
	               '</div>';
			});

				
	}
	




	/**** --- TABLE KEYS controller: table-keys  ***/
	
	
	function disable_table_keys(){
		// console.log('disable_table_keys tree_counter');

		let keys = d3.selectAll('.table-keys--key');
		let keys_container = d3.select('#table-keys');
		
				keys.each(function(d,i){
					d3.select(this.parentNode.parentNode).classed("table-key--active", true);
					//console.log(d3.select(this.parentNode.parentNode));
				});
		
		keys_container.classed("list-active", false);

		
	}
	function  init_table_keys(){
		
		//console.log('wellcome from init_table_keys');
		let keys = d3.selectAll('.table-keys--key');
		let keys_container = d3.select('#table-keys');
		keys_container.classed("list-active", true);
		
			
		keys.on('click', function(){

			if(!tree_counter){
				console.log('init_table_keys', this.id, this.parentNode.parentNode);
				let key_id = this.id;
				let parent = this.parentNode.parentNode;
				let table_rows = d3.selectAll('.table-row-parent').filter(function(d){
					let attr_name = d3.select(this).attr('data-name');
					//console.log("d", d, d3.select(this).attr('data-name'));
					return attr_name === key_id;
				});
				// console.log('init_table_keys table_rows', table_rows);
				d3.select(parent).classed("table-key--active", d3.select(parent).classed("table-key--active") ? false : true);
				
				if(!d3.select(parent).classed("table-key--active")){
					// console.log('table-key--active', "active");
					table_rows.classed('hidden', true);
				}else{
					table_rows.classed('hidden', false);
				}
				
				
				
			}
			
			
		});
		
		
	};


	
	/**** --- DRAW COLLAPSIBLE TREE  ***/
	
	
	
	function get_capacidad_color(val){
		
		let colors = [
			
			{"name": "Formación", "color": "#009fdf", "json": "formacion"},
			{"name": "Investigación", "color": "#8e6aad", "json": "investigacion"},
			{"name": "Instalaciones y equipos", "color": "#e88604", "json": "instalaciones_y_equipos"},
			{"name": "Transferencia", "color": "#df503e", "json": "transferencia"}
			
			
		];	
		
		let colorsL = colors.length;
		let i = 0;
		
		for(i; i < colorsL; i++ ){
			
			if(colors[i].name === val){
				return colors[i].color;
			}
			
		}
	}
	function draw_collapsible_tree(data, select_values, dic){
		
		console.log('draw_collapsible_tree', data.length);
        var guneTree = {
            'key': "4GUNE",
            "values": nest_tree_data(data)

        };
        
        var guneList = nest_list_data(data);
		results_partial = get_results_numbers(guneList);
		
		//console.log('draw_collapsible_tree results_partial', results_partial);
		draw_result_numbers(results_partial, select_values, dic.mejoras);
        
        
        // here we are
        //console.log('guneTree:: ', guneTree, dic);

		


        var root = d3.hierarchy(guneTree, function(d) {
            //console.log('d from hierarchy', d);
            return d.values;

        });
        // console.log('root:: ', root);


        var margin = {
                top: 20,
                right: 90,
                bottom: 30,
                left: 90
            },
            width = 960 - margin.left - margin.right,
            height = 750 - margin.top - margin.bottom;

        var colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['red', 'green']);
        var widthScale = d3.scaleLinear()
            .domain([1, 80])
            .range([1, 10]);


        var i = 0,
            duration = 750;

        // declares a tree layout and assigns the size
        var treemap = d3.tree().size([height, width]);
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level
        root.children.forEach(collapse);
		
		
        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        
        
		d3.select("#tree_container").selectAll("*").remove().exit();

        var svg = d3.select("#tree_container").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" +
                margin.left + "," + margin.top + ")");


        update(root);
        // Collapse the node and all it's children
        function collapse(d) {
            if (d.children) {
                d._children = d.children
                d._children.forEach(collapse)
                d.children = null
            }
        }

        function update(source) {

            // Assigns the x and y position for the nodes
            var treeData = treemap(root);

            //console.log('treeData', treeData);

            // Compute the new tree layout.
            var nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) {

                //console.log('nodes', nodes);
                d.y = d.depth * 180
            });

            // ****************** Nodes section ***************************

            // Update the nodes...
            var node = svg.selectAll('g.node')
                .data(nodes, function(d) {

                   // console.log('nodes d', d, d.depth);
                    return d.id || (d.id = ++i);
                });
            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", function(d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
                .on('click', click);

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style("fill", function(d) {
	                
	               //console.log('fill', d.depth);
	                
					switch(d.depth){
						case 0:
						case 1:
							return d._children ? "chocolate" : "#fff";
							break;
						case 2:
							return "chocolate";
							break;
						case 3:
							return "chocolate";
							break;
						default:
							return 'red';	
					} // --> end swicth
					
			                
	                
	                
	                
	                
	                
	                
	                
	                
                    
                })
                .style("stroke", function(d) {
                    return colorScale(d.data.female / (d.data.female + d.data.male))
                });

            // Add labels for the nodes
            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("x", function(d) {
                    // return d.children || d._children ? -13 : 13;
                    return d.depth <=2 ? -13 : 13;
                })
                .attr("text-anchor", function(d) {
	                // console.log('d text', d.depth);
                    // return d.children || d._children ? "end" : "start";
                    return d.depth <=2 ? "end" : "start";
                })
                .text(function(d) {
	                
	                const reg = /^\d+$/;
	                let temp = null;
	                
	                if(reg.test(d.data.key)){
		                console.log('numberss....');
		                temp = get_dictionary_property(dic.titulos, 'cod', +d.data.key, 'titulo_short_name');
		                return temp;
		                
	                }else{
		                return d.data.key;
	                }
	                //console.log('text d', d.data.key);
                    
                })
                .style("fill", function(d) {
                    return colorScale(d.data.female / (d.data.value))
                });

            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', 10)
                .style("fill", function(d) {
                   
	                // console.log('fill', d.depth);
	                
					switch(d.depth){
						case 0:
						case 1:
							return d._children ? "#D3D3D3" : "#fff";
							break;
						case 2:
							let case_two_fill = get_capacidad_color(d.data.values[0].values[0].capacidad_uno);
							//console.log('case 2:',  d.data.key, d.data.values[0].values[0].capacidad_uno);
							return case_two_fill;
							break;
						case 3:
							let case_three_fill = get_capacidad_color(d.data.values[0].capacidad_uno);

							//console.log('case 3:',  d.data.key, d.data.values[0].capacidad_uno);
							return case_three_fill;
							break;
						default:
							return 'red';	
					} // --> end swicth
                   
                   
                   
                   
                   
                })
                .attr('cursor', 'pointer');


            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + source.y + "," + source.x + ")";
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            var link = svg.selectAll('path.link')
                .data(links, function(d) {
                    return d.id;
                })
                .style('stroke-width', function(d) {
                    return widthScale(d.data.value)
                });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', function(d) {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    }
                    return diagonal(o, o)
                })
                .style('stroke-width', function(d) {
                    return widthScale(d.data.value)
                });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(duration)
                .attr('d', function(d) {
                    return diagonal(d, d.parent)
                });

            // Remove any exiting links
            var linkExit = link.exit().transition()
                .duration(duration)
                .attr('d', function(d) {
                    var o = {
                        x: source.x,
                        y: source.y
                    }
                    return diagonal(o, o)
                })
                .style('stroke-width', function(d) {
                    return widthScale(d.data.value)
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {

                var path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

                return path
            }

            // Toggle children on click.
            function click(d) {
                console.log('click', d);

                if (d.depth <= 2) {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d);

                }
                if(d.depth === 3){
	              /*  
				let ubicacion_obj = get_dictionary_obj(dic.direcciones, "direccion_id", d.values[0].direccion_id);// falta
				let ubicacion = ubicacion_obj.direccion + ', ' + ubicacion_obj.cp + ' ' + ubicacion_obj.localidad + ', ' +  ubicacion_obj.provincia;
				let web_info = checkWebInfo(titulo_obj.web);
				let descripcion = titulo_obj.desc;
				*/
	                
	                
	                
	                
	                
	                
	                
	                console.log('d tree', d);
	                let cod = +d.data.key;
	                let all_values = d.data.values[0];
	                let titulo = get_dictionary_obj(dic.titulos, "cod", cod);
					let univ = get_dictionary_obj(dic.universidades, "univ_id", all_values.univ_id);

	                
	                // variables
					let capacidad_dos = all_values.capacidad_dos;
					let capacidad_color = get_capacidad_color(all_values.capacidad_uno);
					let titulo_name = titulo.titulo;
					let titulo_email = titulo.email;
					let univ_centro = all_values.centro;
					let titulo_responsable = titulo.responsable;
					let titulo_web =  titulo.web.indexOf('http') != -1 ? titulo.web : "javascript:void(0);";
					let univ_name = univ.univ;
					let univ_url = univ.univ_url;
					let email_info = getEmailInfo(titulo);
					let univ_logo = url_img + 'univ/'+ univ.univ_short_name +"-color@2x.png";
					let ubicacion_obj = get_dictionary_obj(dic.direcciones, "direccion_id", all_values.direccion_id);
					let ubicacion = ubicacion_obj.direccion + ', ' + ubicacion_obj.cp + ' ' + ubicacion_obj.localidad + ', ' +  ubicacion_obj.provincia;
						
					
					let modal_star_id = d3.select('#modal_star_id').classed("star-icon--green", all_values.i_d === 1 ? true : false);
					let modal_star_produccion = d3.select('#modal_star_produccion').classed("star-icon--green", all_values.produccion === 1 ? true : false);
					let modal_star_suministros = d3.select('#modal_star_suministros').classed("star-icon--green", all_values.suministro_y_compras === 1 ? true : false);
					let modal_star_almacenamiento = d3.select('#modal_star_almacenamiento').classed("star-icon--green", all_values.almacenamiento_y_logistica === 1 ? true : false);
					let modal_star_marketing = d3.select('#modal_star_marketing').classed("star-icon--green", all_values.marketing === 1 ? true : false);
					let modal_star_ventas = d3.select('#modal_star_ventas').classed("star-icon--green", all_values.ventas === 1 ? true : false);
					let modal_star_servicios = d3.select('#modal_star_servicios').classed("star-icon--green", all_values.servicios === 1 ? true : false);
					let modal_star_administracion = d3.select('#modal_star_administracion').classed("star-icon--green", all_values.administracion === 1 ? true : false);
	                
	                 console.log('d tree', all_values, univ);
	                 
	                 // assign
	                 d3.select('#capacidad_dos').html(capacidad_dos);
	                 d3.select('#capacidad_color').style("color", capacidad_color);
	                 d3.select('#titulo_name').html(titulo_name);
	                 d3.select('#univ_name').html(univ_name);
	                 d3.select('#univ_centro').html(univ_centro);
	                 // d3.select('#titulo_responsable').html(titulo_responsable);
	                 d3.select('#email_info').html(email_info);
	                 d3.select('#univ_url').attr('href', univ_url);
	                 d3.select('#univ_logo').attr('src', univ_logo);
	                 d3.select('#titulo_url').attr('href', titulo_web);
	                 d3.select('#titulo_direccion').html(ubicacion);
	                 
	                 
	                 
	                 
	                 // modal window
	                $("#myModalFullscreen").modal();
                }
            }
        } // --> update source ends
		
		
	};

/*
						tab.classed("hidden", tab.classed("hidden") ? false : true);

	
                  <div class="cell-modal star"><span class="star-text--container">I+D</span><span class="star-icon--container"><i id="modal_star_id" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Producción</span><span class="star-icon--container"><i id="modal_star_produccion" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Suministros y compras</span><span class="star-icon--container"><i id="modal_star_suministros" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Almacenamiento y logística</span><span class="star-icon--container"><i id="modal_star_almacenamiento" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Marketing</span><span class="star-icon--container"><i id="modal_star_marketing" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Ventas</span><span class="star-icon--container"><i id="modal_star_ventas" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Servicios</span><span class="star-icon--container"><i id="modal_star_servicios" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
                  <div class="cell-modal star"><span class="star-text--container">Administración</span><span class="star-icon--container"><i id="modal_star_administracion" class="fa star-icon star-icon--gray">&#xf005;</i></span></div>
	
	
*/	
	



	function init_overall_tree(data, values, dic){
		//console.log('init_overall_tree', data, values);

		let subambito_filter = filter_data(data, values);
		// console.log('init_overall_tree temp', subambito_filter);
		let mejora_filter = filter_mejora(subambito_filter, values);

		//console.log('init_overall_tree mejora_filter', mejora_filter);
		
		
		//results_partial = get_results_numbers(nested_list_data);
		// draw_result_numbers(results_partial, values, dic.mejoras);
		disable_table_keys();
		if(mejora_filter.length){
			draw_collapsible_tree(mejora_filter, values, dic);
		}else{
			d3.select("#tree_container").selectAll("*").remove().exit();
			$("#NoDataModalFullscreen").modal();

			console.log('NO DATA');
		}
		
		
		
	}




	



	
	function init_ver_mas(){
		var x = document.getElementsByTagName("BODY")[0].addEventListener('click', function(e) {
			// do nothing if the target does not have the class drawnLine
				//if (!e.target.classList.contains("drawnLine")) return;
				
				if(e.target.id.indexOf("link_") > -1){
					
					
					let el = e.target;
					let temp = el.id.split('_')[1];
					
					let tab  = d3.select('#more_' + temp)
					console.log(temp, d3.select('#more_' + temp));
					// el.attr("class", "hidden");
					
					tab.classed("hidden", tab.classed("hidden") ? false : true);
					
					console.log(d3.select(el).html());
					d3.select(el).html() === '&nbsp;Ver menos' ? d3.select(el).html('&nbsp;Ver más') : d3.select(el).html('&nbsp;Ver menos'); 

				}
		});
		
	}
	
	function init_table(){
		//console.log('init_table.....');

		let element = document.getElementById('ambito_select');
		element.dispatchEvent(new Event("change")); 
		
		init_table_keys();
		
	}
	
	
	function init_pill_tabs(data, dic){
		
		const pill_list_tab = d3.select('#pills-list-tab');
		const pill_tree_tab = d3.select('#pills-tree-tab');
		
		
		pill_list_tab.on('click', function(){
			tree_counter = false;

			
			//console.log('pill_list_tab', tree_counter);
			init_table();

			
			
		});

		pill_tree_tab.on('click', function(){
			
			tree_counter = true;
			//console.log('pill_tree_tab', tree_counter);
			//console.log('pill_tree_tab.on select_values', selectValues);
			init_overall_tree(data, selectValues, dic);

			
			
		});



	}
	
	
	
    let init = function(error, gune, dic) {
		
		console.log('hello from D3', gune, dic);
		if (error) throw error;
		
	    build_selects(gune, dic);
		init_table();
	    init_ver_mas();
		
		// here pasar a pill tabs la data y select values para iniciar tree
	    init_pill_tabs(gune, dic);

    }	// --> init ends            

})(window, d3);