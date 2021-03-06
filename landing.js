const vis = {

    data : {

        raw : null,

        filtros : null,

        summarised : {},

        filtered : {},

        maximos : {},

        load : function() {

            fetch("./output_completo.json", {mode: 'cors'})
              .then( response => response.json())
              .then( data => vis.ctrl.begin(data))
              .catch( error => console.log( error ) );

        },

        summarise : function(filter = null) {

            // filter tem que vir na forma de objeto, e.g.: {genero : "Masculino"}

            const data = vis.data.raw;
            const grupos = Object.keys(data);

            function sumariza_grupo(grupo, filter) {

                let maximo = 0;

                //console.log("Grupo", grupo);

                const key = filter ? "filtered" : "summarised";

                //console.log(filter, key);

                vis.data[key][grupo] = {};
                const summary = vis.data[key][grupo];

                const perguntas = Object.keys(data[grupo]);

                perguntas.forEach(pergunta => {

                    const tipo = data[grupo][pergunta].tipo[0];

                    //console.log(grupo, "Pergunta", pergunta, " Tipo: ", tipo);

                    if (tipo == "simples") {

                        let sub_data = data[grupo][pergunta].dados;

                        if (filter) {

                            //console.log("Aplicando filtros")

                            const colunas_a_filtrar = Object.keys(filter);

                            colunas_a_filtrar.forEach(coluna => {

                                sub_data = sub_data.filter(d => d[coluna] == filter[coluna]);

                            })

                            //console.log("sub data depois", sub_data);

                        }

                        summary[pergunta] = vis.utils.group_and_sum(sub_data, coluna_categoria = "resposta", coluna_valor = "n", ordena_decrescente = true);

                        // para apurar os máximos por grupo, que serão usados para definir a escala
                        if (!filter) {
                            const maior_valor_pergunta = summary[pergunta][0].subtotal;
                            maximo = Math.max(maximo, maior_valor_pergunta);
                        }

                        // testa se dataset filtrado tem mesma estrutura do original

                        if (filter) {

                            const original_data = vis.data.summarised[grupo][pergunta];
                            const filtered_data = summary[pergunta];

                            //console.log("Tem filtro", pergunta, filtered_data, original_data);

                            if (filtered_data.length != original_data.length) {

                                //console.log("Opa, diferença!", pergunta, filtered_data, original_data);

                                const categorias = original_data.map(d => d.categoria);

                                categorias.forEach(categoria => {

                                    const datum = filtered_data.filter(d => d.categoria == categoria);

                                    if (datum.length == 0) {

                                        filtered_data.push({
                                            categoria : categoria,
                                            subtotal : 0
                                        })

                                    }

                                })

                            }
        
                        }

                    } else {

                        summary[pergunta] = {};

                        const sub_perguntas = Object.keys(data[grupo][pergunta].dados);

                        sub_perguntas.forEach(sub_pergunta => {

                            let sub_data = data[grupo][pergunta].dados[sub_pergunta];

                            if (filter) {

                                const colunas_a_filtrar = Object.keys(filter);
    
                                colunas_a_filtrar.forEach(coluna => {
    
                                    sub_data = sub_data.filter(d => d[coluna] == filter[coluna]);
    
                                })
    
                            }

                            //console.log("Subpergunta: ", sub_pergunta);

                            summary[pergunta][sub_pergunta] = vis.utils.group_and_sum(sub_data, coluna_categoria = "resposta", coluna_valor = "n", ordena_decrescente = true)

                            // para apurar os máximos por grupo, que serão usados para definir a escala
                            if (!filter) {

                                const maior_valor_pergunta = summary[pergunta][sub_pergunta][0].subtotal;
                                maximo = Math.max(maximo, maior_valor_pergunta);

                            }

                                                    // testa se dataset filtrado tem mesma estrutura do original

                            if (filter) {

                                const original_data = vis.data.summarised[grupo][pergunta][sub_pergunta];
                                const filtered_data = summary[pergunta][sub_pergunta];

                                if (filtered_data.length != original_data.length) {

                                    const categorias = original_data.map(d => d.categoria);

                                    categorias.forEach(categoria => {

                                        const datum = filtered_data.filter(d => d.categoria == categoria);

                                        if (datum.length == 0) {

                                            filtered_data.push({
                                                categoria : categoria,
                                                subtotal : 0
                                            })

                                        }

                                    })

                                }
            
                            }

                        })

                    }

                })

                if (!filter) {

                    // maximos não vão ser alterados, então só atualiza uma vez.
                    vis.data.maximos[grupo] = maximo;

                }

            }

            // grupos

            grupos.forEach(grupo => sumariza_grupo(grupo, filter));

            // parecido com a lógica para gerar a estrutura.

        }

    },

    utils : {

        unique : function(data, col) {

            return data
              .map(d => d[col])
              .filter((v, i, a) => a.indexOf(v) === i);
        
        },

        group_and_sum : function(objeto, coluna_categoria, coluna_valor, ordena_decrescente = false) {

            const resultado = []; 

            const categorias_unicas = objeto
                                        .map(d => d[coluna_categoria])
                                        .filter((v, i, a) => a.indexOf(v) === i);

            for (cat of categorias_unicas) {

              const soma = objeto
                              .filter(d => d[coluna_categoria] === cat)
                              .map(d => +d[coluna_valor])
                              .reduce((valor_acum, valor_atual) => valor_acum + valor_atual);

              resultado.push({"categoria" : cat,
                              "subtotal"  : soma});  

            }

            if (ordena_decrescente) resultado.sort((a,b) => b.subtotal - a.subtotal)

            return resultado;

        },

        get_selector : function(grupo, pergunta, subpergunta) {

            let selector = `[data-grupo="${grupo}"]` + ` [data-pergunta="${pergunta}"]`;

            if (subpergunta) selector += ` [data-sub_pergunta="${subpergunta}"]`

            return selector;

        },

        is_equal : function(obj1, obj2) {

            const keys_1 = Object.keys(obj1);
            const keys_2 = Object.keys(obj2);
         
            if (keys_1.length != keys_2.length) return false;
         
            for (key of keys_1) {

                if (obj1[key] != obj2[key]) return false;

            }
         
            for (key of keys_2) {

                if (obj1[key] != obj2[key]) return false;

            }
         
            return true;

        },

        formata_pct : function(value) {

            return ( (100 * value).toFixed(1) + "%" ).replace(".", ",");

        }

    },

    sizings : {

        width: null,

        ref: ".svg-container",

        get_width : function() {

            const div = document.querySelector(this.ref);

            this.width = div.getBoundingClientRect().width;

        },

        set : function(height, grupo, pergunta, subpergunta) {

            let selector = vis.utils.get_selector(grupo, pergunta, subpergunta);

            console.log(selector);

            d3.select(selector + ' svg')
              .attr("width", this.width)
              .attr("height", height);

        }



    },

    barcharts : {

        data : null,

        selector : null,

        margins : {

            top : 20, right: 50, bottom: 20, left: 1
            //esse +1 no left para caber o stroke de 2px dos rect.main

        },

        height: 30,

        svg : {

            container : ".svg-container",

            height : null,

            build : function(grupo, pergunta, subpergunta) {

                let selector = vis.utils.get_selector(grupo, pergunta, subpergunta);

                selector += " " + this.container;

                // isso não funciona.. pq?
                // const container = document.querySelector(selector);
                // const svg = document.createElement("svg");
                // container.appendChild(svg);

                const container = d3.select(selector);
                container
                  .append("svg")
                  .attr("width", vis.sizings.width)
                  .attr("height", this.height + 1); // esse +1 para caber o stroke de 2px dos rect.main

            }

        },

        scales : {

            x : null,

            y : d3.scaleBand(), // varia para cada pergunta/sub-pergunta

            w : d3.scaleLinear(), // o mesmo para o grupo inteiro

            set : {
                
                w : function(grupo) {

                    const bar = vis.barcharts;

                    bar.scales.w
                      .range(
                          [ 0, vis.sizings.width - bar.margins.right - bar.margins.left ]
                          )
                      .domain(
                          [ 0, 1 ]//vis.data.maximos[grupo] ]
                      )

                },

                y : function(grupo, pergunta, subpergunta) {

                    const bar = vis.barcharts;

                    let sumario = vis.data.summarised[grupo][pergunta];

                    //console.log("Sumario para esta escala Y", sumario);

                    if (subpergunta) sumario = sumario[subpergunta];

                    const domain = sumario.map(d => d.categoria);
                    const range = domain.length * bar.height * 2.2;

                    //console.log(domain, range);

                    bar.scales.y
                      .domain(domain)
                      .range([0, range])
                      .paddingInner(0.6) // edit the inner padding value in [0,1]
                      .paddingOuter(0.2) // edit the outer padding value in [0,1]
                      .align(1); // edit the align: 0 is aligned left, 0.5 centered, 1 aligned right.

                    // com isso espero barras e espaçamentos de mesma largura.

                    // para construir o svg atual
                    bar.svg.height = range;

                }



            }

        },

        get_data_and_selector : function(type, grupo, pergunta, subpergunta) {

            //console.log('getting data and selector', type, grupo, pergunta, subpergunta);

            let data_ref = type == "main" ? "summarised" : "filtered";

            if (vis.ctrl.state.primeira_vez_barras_filtros) {
                data_ref = "summarised";
            }

            //console.log(type, grupo, pergunta, subpergunta);

            let data = vis.data[data_ref][grupo][pergunta];
            if (subpergunta) data = data[subpergunta];

            let selector = vis.utils.get_selector(grupo, pergunta, subpergunta);

            this.selector = selector;
            this.data = data;

        },

        components : {

            marks : function(type, selector, data) {

                const svg = d3.select(selector + " svg");

                const total = d3.sum(data, d => d.subtotal);

                svg
                  .selectAll("rect." + type)
                  .data(data, d => d.categoria)
                  .join("rect")
                  .classed(type, true)
                  .attr("x", vis.barcharts.margins.left)
                  .attr("y", d => vis.barcharts.scales.y(d.categoria))
                  .attr("height", vis.barcharts.scales.y.bandwidth())
                  .attr("width", total == 0 ? 0 : d => vis.barcharts.scales.w(d.subtotal / total))
                  .attr('data-original-width', total == 0 ? 0 : d => vis.barcharts.scales.w(d.subtotal / total)) //salva
                ; // quando criar inicialmente as barras dos valores filtrados, deixá-las sem tamanho
            },

            value_labels : function(type, selector, data) {

                const cont = d3.select(selector + " .svg-container");

                const total = d3.sum(data, d => d.subtotal);

                const formata_pct = vis.utils.formata_pct;


                cont
                  .selectAll("p.value-labels." + type)
                  .data(data, d => d.categoria)
                  .join("p")
                  .classed(type, true)
                  .classed('labels', true)
                  .classed('value-labels', true)
                  .style("top", d => vis.barcharts.scales.y(d.categoria) + "px")
                  .style("line-height", vis.barcharts.scales.y.bandwidth() + "px")
                  .html(d => `<strong>${total == 0 ? 0 : formata_pct(d.subtotal/total)}</strong>`)
                  .style("left", d => vis.barcharts.scales.w(d.subtotal/total) + "px")
                ;

            },

            categories_labels : function(type, selector, data) {

                const cont = d3.select(selector + " .svg-container");

                cont
                  .selectAll("p.cat-labels." + type)
                  .data(data, d => d.categoria)
                  .join("p")
                  .classed(type, true)
                  .classed('labels', true)
                  .classed('cat-labels', true)
                  .style("left", 0)
                  .style("top", d => vis.barcharts.scales.y(d.categoria) + "px")
                  .text(d => d.categoria)
                ;

            },

            strips : function(selector, data) {

                const cont = d3.select(selector + " .svg-container");

                const total = d3.sum(data, d => d.subtotal);

                cont
                  .selectAll("div.strip")
                  .data(data, d => d.categoria)
                  .join("div")
                  .classed('strip', true)
                  .style("left", d => vis.barcharts.scales.w(d.subtotal / total) + 'px')
                  .style("top", d => vis.barcharts.scales.y(d.categoria) + 'px')
                  .style("height", vis.barcharts.scales.y.bandwidth() + 'px')
                ; // quando criar inicialmente as strips, deixá-las com scaleY(0) no css;
            },



        },

        render : function(type, grupo, pergunta, subpergunta) {

            const bar = vis.barcharts;

            if (type == "main") {

                bar.scales.set.y(grupo, pergunta, subpergunta);
                bar.svg.build(grupo, pergunta, subpergunta);
                bar.get_data_and_selector(type, grupo, pergunta, subpergunta);
                bar.components.marks(type, bar.selector, bar.data);
                bar.components.strips(bar.selector, bar.data);
                bar.components.value_labels(type, bar.selector, bar.data);
                bar.components.categories_labels(type, bar.selector, bar.data);

            } else {

                bar.scales.set.y(grupo, pergunta, subpergunta);
                bar.get_data_and_selector(type, grupo, pergunta, subpergunta);
                //bar.components.marks(type, bar.selector, bar.data);
                bar.components.value_labels(type, bar.selector, bar.data);

            }



        },

        render_all : function(type) {

            const data = vis.data.raw;
            const grupos = Object.keys(data);

            function build_grupo(grupo) {

                console.log("Montando gráficos grupo: ", grupo);

                if (type == "main") {
                    vis.barcharts.scales.set.w(grupo);
                } 
                // evita fazer nova escaça w para as barras filtradas
                

                const codigos_perguntas = Object.keys(data[grupo]);
    
                codigos_perguntas.forEach(pergunta => {
    
                    if (data[grupo][pergunta].tipo[0] == "simples") {

                        vis.barcharts.render(type, grupo, pergunta);

                    } else {

                        const sub_perguntas = Object.keys(data[grupo][pergunta].dados);

                        sub_perguntas.forEach(sub_pergunta => {

                            vis.barcharts.render(type, grupo, pergunta, sub_pergunta);

                        })

                    }
    
                })

            }

            grupos.forEach(grupo => build_grupo(grupo));

        },

        update_filtered_rects : function(tem_filtro) {

            console.log(tem_filtro);

            const data = vis.data.filtered;
            const grupos = Object.keys(vis.data.raw);
            const bar = vis.barcharts;

            function update_width(grupo, pergunta, subpergunta) {

                let type = "filtered";

                bar.get_data_and_selector(type, grupo, pergunta, subpergunta);

                //console.log("ATUALIZANDO", grupo, pergunta, subpergunta, bar.data, bar.data.map(d => vis.barcharts.scales.w(d.subtotal)));

                const selector = bar.selector;

                const svg = d3.select(selector + " svg");

                const total = d3.sum(bar.data, d => d.subtotal);

                svg
                  .selectAll("rect.main") //+ type)
                  .data(bar.data, d => d.categoria)
                  .transition()
                  .duration(750)
                  .attr("width", function(d) {
                    
                    const original_width = d3.select(this).attr('data-original-width');

                    if (tem_filtro) return total == 0 ? 0 : vis.barcharts.scales.w(d.subtotal / total);
                    else return original_width;

                  })
                ; // quando criar inicialmente as barras dos valores filtrados, deixá-las sem tamanho


                // labels
                const cont = d3.select(selector + " .svg-container");

                const formata_pct = vis.utils.formata_pct;

                //type = "filtered";

                cont
                  .selectAll("p.value-labels." + type)
                  .data(bar.data, d => d.categoria)
                  .join("p")
                  .classed(type, true)
                  .classed('labels', true)
                  .classed('value-labels', true)
                  .style("left", d => tem_filtro ? vis.barcharts.scales.w(d.subtotal/total) + "px" : 0)
                  .html(d => `<span>${total == 0 ? 0 : formata_pct(d.subtotal/total)}</span>`)
                ;



            }

            function update_value_labels(grupo, pergunta, subpergunta) {

                const cont = d3.select(selector + " .svg-container");

                const total = d3.sum(data, d => d.subtotal);

                function formata_pct(value) {

                    return ( (100 * value).toFixed(1) + "%" ).replace(".", ",");

                }

                cont
                  .selectAll("p.value-labels." + type)
                  .data(data, d => d.categoria)
                  .join("p")
                  .classed(type, true)
                  .classed('labels', true)
                  .classed('value-labels', true)
                  .style("left", 0)
                  .style("top", d => vis.barcharts.scales.y(d.categoria) + "px")
                  .style("line-height", vis.barcharts.scales.y.bandwidth() + "px")
                  .html(d => "<strong>" + d.subtotal + `</strong> (${formata_pct(d.subtotal/total)})`)
                  .transition()
                  .duration(500)
                  .style("left", d => vis.barcharts.scales.w(d.subtotal) + "px")
                ;

            }

            function atualiza_grupo(grupo) {

                //console.log("Atualizando gráficos grupo: ", grupo);

                vis.barcharts.scales.set.w(grupo);

                const codigos_perguntas = Object.keys(data[grupo]);
    
                codigos_perguntas.forEach(pergunta => {

                    //console.log("to aqui", data[grupo][pergunta], pergunta);

                    const tipo = vis.data.raw[grupo][pergunta].tipo[0];
    
                    if (tipo == "simples") {

                        update_width(grupo, pergunta);

                    } else {

                        const sub_perguntas = Object.keys(data[grupo][pergunta]);

                        sub_perguntas.forEach(sub_pergunta => {

                            update_width(grupo, pergunta, sub_pergunta);

                        })

                    }
    
                })

            }

            grupos.forEach(grupo => atualiza_grupo(grupo));

        }




    },

    tabs : {

        refs : {

            tabs : '[role="tab"]',
            tablist : '[role="tablist"]'

        },

        monitor : function() {

            //console.log('monitoring...');

            window.addEventListener("DOMContentLoaded", () => {

                const tabs = document.querySelectorAll(this.refs.tabs);
                const tabList = document.querySelector(this.refs.tablist);
              
                // Add a click event handler to each tab
                tabs.forEach(tab => {
                    //console.log("handler", tab);
                    tab.addEventListener("click", this.changeTabs);
                });
              
                // Enable arrow navigation between tabs in the tab list
                let tabFocus = 0;
              
                tabList.addEventListener("keydown", e => {
                  // Move right
                  if (e.keyCode === 39 || e.keyCode === 37) {
                    tabs[tabFocus].setAttribute("tabindex", -1);
                    if (e.keyCode === 39) {
                      tabFocus++;
                      // If we're at the end, go to the start
                      if (tabFocus >= tabs.length) {
                        tabFocus = 0;
                      }
                      // Move left
                    } else if (e.keyCode === 37) {
                      tabFocus--;
                      // If we're at the start, move to the end
                      if (tabFocus < 0) {
                        tabFocus = tabs.length - 1;
                      }
                    }
              
                    tabs[tabFocus].setAttribute("tabindex", 0);
                    tabs[tabFocus].focus();
                  }
                });
            });

        },
            
        changeTabs : function(e) {

            const target = e.target;
            const parent = target.parentNode;
            const grandparent = parent.parentNode;
            const greatgrandparent = grandparent.parentNode;

            //console.log("CLicked", target);
            
            // Remove all current selected tabs
            parent
                .querySelectorAll('[aria-selected="true"]')
                .forEach(t => t.setAttribute("aria-selected", false));
            
            // Set this tab as selected
            target.setAttribute("aria-selected", true);
            
            // Hide all tab panels
            greatgrandparent
                .querySelectorAll('[role="tabpanel"]')
                .forEach(p => p.setAttribute("hidden", true));
            
            // Show the selected panel
            greatgrandparent.parentNode
                .querySelector(`#${target.getAttribute("aria-controls")}`)
                .removeAttribute("hidden");
        },

    },

    structure : {

        init : function() {

            const data = vis.data.raw;
            const grupos = Object.keys(data);


            function build_grupo(grupo) {

                if (grupo == "facetas") return;

                //console.log("Montando grupo: ", grupo);

                const grupo_element = document.querySelector("article[data-grupo='" + grupo + "']");

                const codigos_perguntas = Object.keys(data[grupo]);
    
                codigos_perguntas.forEach(codigo_pergunta => {
    
                    grupo_element.appendChild(vis.structure.build.common(grupo, codigo_pergunta));
    
                })

            }

            grupos.forEach(grupo => build_grupo(grupo));

        },

        build : {

            // comun para todas as perguntas

            "common" : function(grupo, codigo_pergunta) {

                const data = vis.data.raw[grupo][codigo_pergunta];

                const pergunta = data.nome_completo;

                const section = document.createElement("section");
                section.dataset.pergunta = codigo_pergunta;

                const h2 = document.createElement("h2");
                h2.innerText = pergunta + " (" + codigo_pergunta + ")";

                section.appendChild(h2);

                const tipo_pergunta = data.tipo[0];

                section.appendChild(vis.structure.build[tipo_pergunta](data));

                return section;

            },

            // especificidades de cada tipo de pergunta

            "simples" : function(data) {

                const container = document.createElement("div");
                container.classList.add("svg-container");

                //const svg = document.createElement("svg");
                //container.appendChild(svg);

                return container;
            },

            "multiplas com escala" : function(data) {

                function build_sub_pergunta(sub_pergunta) {

                    const section = document.createElement("section");
                    section.dataset.sub_pergunta = sub_pergunta;

                    const h3 = document.createElement("h3");
                    h3.innerText = sub_pergunta;

                    section.appendChild(h3);

                    const container = document.createElement("div");
                    container.classList.add("svg-container");
    
                    //const svg = document.createElement("svg");
                    //container.appendChild(svg);

                    section.appendChild(container);

                    return section;

                }

                const container_sub_perguntas = document.createElement("div");

                const sub_perguntas = Object.keys(data.dados);

                sub_perguntas.forEach(sub_pergunta => {

                    container_sub_perguntas.appendChild(
                        build_sub_pergunta(sub_pergunta)
                    )

                })

                return container_sub_perguntas;

            }

        }

    },

    filter : {

        criterios : ['campus', 'cor', 'genero', 'vinculo', 'filhos'],

        populate : function() {

            const crit = this.criterios;

            crit.forEach(criterio => {

                const seletor = document.querySelector('#filtro-' + criterio);

                const opcoes = vis.data.filtros[criterio];

                //console.log("Opcoes", opcoes);

                opcoes.forEach(opcao => {

                    const new_option = document.createElement('option');

                    new_option.value = opcao;
                    new_option.text = opcao == "Servidor(a) técnico(a)/ administrativo(a)" ? "Servidor" : opcao;

                    seletor.append(new_option);

                })

            })

        },

        ref: '.filtros-controles',

        monitor : function() {

            const seletores = document.querySelector(this.ref);

            seletores.addEventListener('change', vis.filter.handle_change)

        },

        handle_change : function(e) {

            const opcao = e.target.value;
            const criterio = e.target.id.slice(7); // para tirar o "filtro-""
            const filter = vis.ctrl.state.filter;

            const new_filter = Object.assign({}, filter);

            if (opcao != "") {

                new_filter[criterio] = opcao;

            } else {

                delete new_filter[criterio];
                // remove a propriedade do filtro

            }

            // não precisa desse if, pq se a opção continuar igual ele não dispara evento de change.

            // if ( vis.utils.is_equal(filter, new_filter) ) {

            //     // do nothing
            //     console.log("same filter, do nothing");

            // } else {

            vis.ctrl.state.filter = new_filter;

            vis.filter.highlight_label();

            const tem_filtro = Object.keys(new_filter).length > 0;

            // updates o data attribute que controla o estilo dos rects principais
            document.querySelector('[data-filtered]').dataset.filtered = tem_filtro;
            
            // updates filtered data
            vis.data.summarise(new_filter);

            // updates as barras dos dados filtrados
            vis.barcharts.update_filtered_rects(tem_filtro);

            //console.log(vis.ctrl.state.filter);

            // }

        },

        highlight_label : function() {

            const filtros = Object.keys(vis.ctrl.state.filter);

            const criterios = this.criterios;

            // label for="filtro-vinculo

            criterios.forEach(criterio => {

                const filtro_estah_ativo = filtros.includes(criterio);

                const label = d3.select('[for="filtro-' + criterio + '"]');
                const select = d3.select('#filtro-' + criterio);

                label.classed("filtro-ativo", filtro_estah_ativo);
                select.classed("filtro-ativo", filtro_estah_ativo);

            });

        }

    },

    ctrl : {

        state : {

            filter : {},

            primeira_vez_barras_filtros : true

        },

        monitors : () => {

            vis.tabs.monitor();

        },

        init : () => {

            vis.ctrl.monitors();

            vis.data.load();

        },

        begin: (data) => {

            vis.data.raw = data.dados;
            vis.data.filtros = data.filtros;

            vis.filter.populate();
            vis.filter.monitor();

            vis.structure.init();

            vis.sizings.get_width();

            vis.data.summarise();
            //vis.data.summarise(filter = "");


            //vis.barcharts.scales.set.w("renda");

            //vis.barcharts.render("main", "renda", "G04Q235");

            //vis.data.filtered = vis.data.summarised;

            vis.barcharts.render_all("main");
            vis.barcharts.render_all("filtered");
            
            vis.ctrl.state.primeira_vez_barras_filtros = false;


        }

    }

}

vis.ctrl.init();
