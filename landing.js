const vis = {

    data : {

        raw : null,

        summarised : {},

        filtered : {},

        maximos : {},

        load : function() {

            fetch("./output2.json", {mode: 'cors'})
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

                console.log("Grupo", grupo);

                const key = filter ? "filtered" : "summarised";

                console.log(filter, key);

                vis.data[key][grupo] = {};
                const summary = vis.data[key][grupo];

                const perguntas = Object.keys(data[grupo]);

                perguntas.forEach(pergunta => {

                    const tipo = data[grupo][pergunta].tipo[0];

                    console.log("Pergunta", pergunta, " Tipo: ", tipo);

                    if (tipo == "simples") {

                        let sub_data = data[grupo][pergunta].dados;

                        if (filter) {

                            //console.log("Aplicando filtros")

                            const colunas_a_filtrar = Object.keys(filter);

                            colunas_a_filtrar.forEach(coluna => {

                                sub_data = sub_data.filter(d => d[coluna] == filter[coluna]);

                            })

                            console.log("sub data depois", sub_data);

                        }

                        summary[pergunta] = vis.utils.group_and_sum(sub_data, coluna_categoria = "resposta", coluna_valor = "n", ordena_decrescente = true);

                        // para apurar os máximos por grupo, que serão usados para definir a escala
                        if (!filter) {
                            const maior_valor_pergunta = summary[pergunta][0].subtotal;
                            maximo = Math.max(maximo, maior_valor_pergunta);
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

                            console.log("Subpergunta: ", sub_pergunta);

                            summary[pergunta][sub_pergunta] = vis.utils.group_and_sum(sub_data, coluna_categoria = "resposta", coluna_valor = "n", ordena_decrescente = true)

                            // para apurar os máximos por grupo, que serão usados para definir a escala
                            if (!filter) {

                                const maior_valor_pergunta = summary[pergunta][sub_pergunta][0].subtotal;
                                maximo = Math.max(maximo, maior_valor_pergunta);

                            }


                        })

                    }

                })

                vis.data.maximos[grupo] = maximo;

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

            top : 20, right: 20, bottom: 20, left: 0

        },

        height: 20,

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
                  .attr("height", this.height);

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
                          [ 0, vis.data.maximos[grupo] ]
                      )

                },

                y : function(grupo, pergunta, subpergunta) {

                    const bar = vis.barcharts;

                    let sumario = vis.data.summarised[grupo][pergunta];

                    console.log("Sumario para esta escala Y", sumario);

                    if (subpergunta) sumario = sumario[subpergunta];

                    const domain = sumario.map(d => d.categoria);
                    const range = domain.length * bar.height * 2;

                    console.log(domain, range);

                    bar.scales.y
                      .domain(domain)
                      .range([0, range])
                      .paddingInner(0.5) // edit the inner padding value in [0,1]
                      .paddingOuter(0.25) // edit the outer padding value in [0,1]
                      .align(1); // edit the align: 0 is aligned left, 0.5 centered, 1 aligned right.

                    // com isso espero barras e espaçamentos de mesma largura.

                    // para construir o svg atual
                    bar.svg.height = range;

                }



            }

        },

        get_data_and_selector : function(type, grupo, pergunta, subpergunta) {

            let data_ref = type == "main" ? "summarised" : "filtered";
            let data = vis.data[data_ref][grupo][pergunta];
            if (subpergunta) data = data[subpergunta];

            let selector = vis.utils.get_selector(grupo, pergunta, subpergunta);

            this.selector = selector;
            this.data = data;

        },

        components : {

            marks : function(type, selector, data) {

                const svg = d3.select(selector + " svg");

                svg
                  .selectAll("rect." + type)
                  .data(data)
                  .join("rect")
                  .classed(type, true)
                  .attr("x", vis.barcharts.margins.left)
                  .attr("y", d => vis.barcharts.scales.y(d.categoria))
                  .attr("height", vis.barcharts.height)
                  .attr("width", 0)
                  .transition()
                  .duration(500)
                  .attr("width", d => vis.barcharts.scales.w(d.subtotal))
                ;
            },

            value_labels : function(type, selector, data) {

                const cont = d3.select(selector + " .svg-container");

                const total = d3.sum(data, d => d.subtotal);

                function formata_pct(value) {

                    return ( (100 * value).toFixed(1) + "%" ).replace(".", ",");

                }

                cont
                  .selectAll("p." + type)
                  .data(data)
                  .join("p")
                  .classed(type, true)
                  .classed('labels', true)
                  .classed('value-labels', true)
                  .style("left", 0)
                  .style("top", d => vis.barcharts.scales.y(d.categoria) + "px")
                  .style("line-height", vis.barcharts.height + "px")
                  .html(d => "<strong>" + d.subtotal + `</strong> (${formata_pct(d.subtotal/total)})`)
                  .transition()
                  .duration(500)
                  .style("left", d => vis.barcharts.scales.w(d.subtotal) + "px")
                ;

            }



        },



        render : function(type, grupo, pergunta, subpergunta) {

            const bar = vis.barcharts;

            bar.scales.set.y(grupo, pergunta, subpergunta);
            bar.svg.build(grupo, pergunta, subpergunta);
            bar.get_data_and_selector(type, grupo, pergunta, subpergunta);
            bar.components.marks(type, bar.selector, bar.data);
            bar.components.value_labels(type, bar.selector, bar.data);

        }


    },

    tabs : {

        refs : {

            tabs : '[role="tab"]',
            tablist : '[role="tablist"]'

        },

        monitor : function() {

            console.log('monitoring...');

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

            console.log("CLicked", target);
            
            // Remove all current selected tabs
            parent
                .querySelectorAll('[aria-selected="true"]')
                .forEach(t => t.setAttribute("aria-selected", false));
            
            // Set this tab as selected
            target.setAttribute("aria-selected", true);
            
            // Hide all tab panels
            grandparent
                .querySelectorAll('[role="tabpanel"]')
                .forEach(p => p.setAttribute("hidden", true));
            
            // Show the selected panel
            grandparent.parentNode
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

                console.log("Montando grupo: ", grupo);

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

    ctrl : {

        state : {

            svgs_are_drawn : {} // um boolean por grupo

        },

        monitors : () => {

            vis.tabs.monitor();

        },

        init : () => {

            vis.ctrl.monitors();

            vis.data.load();

        },

        begin: (data) => {

            vis.data.raw = data;

            vis.structure.init();

            vis.sizings.get_width();

            vis.data.summarise();

            vis.barcharts.scales.set.w("renda");

            vis.barcharts.render("main", "renda", "G04Q235");


        }

    }

}

vis.ctrl.init();
