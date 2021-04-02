const vis = {

    refs : {

        svg : "svg",
        container_svg : "div.container-svg",
        vis : "div.vis",
        seletor : "div.selector",
        buttons : ".buttons"

    },

    sels : {

        svg : null,
        container_svg : null,
        vis : null,
        seletor : null,
        buttons : null,
        rects : null,
        labels : null

    },

    params : {

        dots : {

            largura : 5,
            altura : 5,
            espacamento : 2,
            margem_entre_barras : 40

        },

        palette : ["#ea7393", "#f495ab", "#a8596f", "#ccccc4", "khaki"],

        from_data : {

            qde_pontos : null,
            qde_fileira : null,
            largura_grupo : null

        }

    },

    dims : {

        vis : null,
        seletor : null,
        svg : {

            height : null,
            width: null,

            margins : {

                top : 50,
                right: 20,
                bottom: 20,
                left: 50

            }

        }

    },

    data : {

        raw : null,
        sumario : null

    },

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis", "seletor"];

                sizes.forEach(size => {

                    const element = vis.sels[size].node()

                    let initial_size = element.offsetHeight; //getBoundingClientRect().height;

                    // usei padding em vez de margins no div do seletor para que o tamanho retornado aqui já esteja correto, sem ter que arrumar um jeito de incorporar o tamanho das margins

                    //let margins = getComputedStyle(element).marginTop + " " + getComputedStyle(element).marginBottom;

                    //console.log(size, " margins: ", margins);
                    
                    vis.dims[size] = initial_size;

                    console.log(size, " tamanho: ", vis.dims[size]);

                })

                vis.dims.svg.width = vis.sels.svg.node().getBoundingClientRect().width;

                console.log(vis.dims);

            },

            set_vsize_svg : function() {

                const svg_height = vis.dims.vis - vis.dims.seletor;

                vis.dims.svg.height = svg_height;

                vis.sels.svg.attr("height", svg_height);
                vis.sels.container_svg.style("height", svg_height + "px");

            },

            evaluate_bar_widths : function() {

                const available_width = vis.dims.svg.width - vis.dims.svg.margins.left - vis.dims.svg.margins.right;

                const quantos_quadradinhos_cabem = Math.floor(available_width / vis.params.dots.largura);

                const qde_fileiras = Math.ceil(vis.params.from_data.qde_pontos / quantos_quadradinhos_cabem);

                vis.params.from_data.qde_fileira = qde_fileiras;
                vis.params.from_data.largura_grupo = qde_fileiras * (vis.params.dots.largura + vis.params.dots.espacamento);

                console.log("Cabem ", quantos_quadradinhos_cabem, " quadradinhos numa fileira. Precisamos de ", qde_fileiras, " fileiras, no pior caso.");

            },

            convertRemToPixels : function(rem) {    
                return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
            }

        },

        data_processing : {

            sumariza_dados : function(criterio, ordena = false, vetor_ordem) {

                const sumario = [];
                const dados = vis.data.raw;
                let categorias_unicas;
    
                // gera array com os valores únicos dessa variável categórica

                console.log(criterio);
            
                if (vetor_ordem) {
                    categorias_unicas = vetor_ordem;
                }
                else {
                    categorias_unicas = dados
                        .map(d => d[criterio])
                        .filter((v, i, a) => a.indexOf(v) === i);
                }

            
                // faz a contagem dos casos para cada valor único da variável categórica
            
                for (cat of categorias_unicas) {
                    const cont = dados
                      .filter(d => d[criterio] === cat)
                      .length;
            
                    sumario.push({"categoria"    : cat,
                                  "contagem"     : cont,
                                  "criterio"     : criterio});
                                  
                }
            
                if (ordena) sumario.sort((a,b) => b.contagem - a.contagem);

                vis.data.sumario = sumario;
            
                return sumario;    
    
            },

            prepara_dados : function(criterio, ordena = false, vetor_ordem) {

                const dados = vis.data.raw;

                // determina valores únicos
                let dados_sumarizados = this.sumariza_dados(criterio, ordena, vetor_ordem);

                console.log(dados_sumarizados);
            
                let contagem_maxima = d3.max(dados_sumarizados, d => d.contagem);
            
                let qde_linhas_grid = vis.params.from_data.qde_fileira; //Math.ceil(Math.sqrt(contagem_maxima));

                const largura_across_grupo = qde_linhas_grid * (vis.params.dots.largura + vis.params.dots.espacamento);
            
                // let parametros_colunas_grid = dados_sumarizados.map(d => {
                //     const qde_colunas = Math.ceil(d.contagem/qde_linhas_grid);
                //     return({ 
                //         "categoria" : d.categoria,
                //         "largura" : qde_colunas * (vis.params.dots.largura + vis.params.dots.espacamento)
                //       }
                //     )
                // });

                // faz um objeto de referencia para controlar a ordem e o contador dos loops, para cada valor da variável

                const indice_grupos = {};

                dados_sumarizados.forEach((d,i) => {

                    d.ordem = i;

                    indice_grupos[d.categoria] = {
                        ordem : i,
                        indice_atual : 0
                    }

                });

                // passa por todo o dataset calculando as posições

                dados.forEach((element,i) => {

                    // "criterio" é  variável de interesse no momento

                    const valor_atual_para_a_variavel = element[criterio];

                    const parametros_grupo = indice_grupos[valor_atual_para_a_variavel]

                    const grupo = parametros_grupo.ordem;
                    const index_across_group = parametros_grupo.indice_atual % (vis.params.from_data.qde_fileira + 1);
                    const index_longit = Math.floor( parametros_grupo.indice_atual / (vis.params.from_data.qde_fileira + 1) );


                    element.group = grupo;
                    element.index_across_group = index_across_group;
                    element.index_longit = index_longit;

                    element.pos_across = 
                      vis.dims.svg.margins.top +
                      grupo * (vis.params.dots.margem_entre_barras + vis.params.from_data.largura_grupo) + index_across_group * (vis.params.dots.largura + vis.params.dots.espacamento);

                    element.pos_longit = index_longit * (vis.params.dots.largura + vis.params.dots.espacamento);

                    // incrementa o contador para esse valor da variavel

                    indice_grupos[valor_atual_para_a_variavel].indice_atual++

                });

                console.log(dados);
                console.log(indice_grupos);
            
                // let pos_inicial_ac = 0;
            
                // let posicoes_iniciais = {};

                /*

                parametros_colunas_grid.forEach((d,i) => {
                    let largura_anterior =
                      i == 0 ? 0 : parametros_colunas_grid[i-1].largura + margem;
            
                    pos_inicial_ac += largura_anterior;
            
                    d["pos_inicial"] = pos_inicial_ac;
            
                    posicoes_iniciais[d.categoria] = d.pos_inicial;
                });
                
                let mini_dados = {};
                mini_dados["dados"] = [];
                let categorias = dados_sumarizados.map(d => d.categoria);
                
                for (cat of categorias) {
                    dados
                      .filter(d => d[criterio] == cat)
                      .forEach((d,i) => mini_dados.dados.push({
                          "nome" : d.nome,
                          "categoria" : d[criterio], // que é próprio cat
                          "x_ini" : d["x_ini"],
                          "y_ini" : d["y_ini"],
                          "x_mol" : d["x_mol"],
                          "y_mol" : d["y_mol"],
                          "x_S3"  : d["x_S3"],
                          "y_S3"  : d["y_S3"],
                          "x" : d.x,
                          "y" : d.y,
                          "value" : d.value,
                          "index_relativo" : i,
                          "eixo_principal" : Math.floor(i / (qde_linhas_grid + 1)) * 3 * raio,
                          "eixo_secundario" : (i % (qde_linhas_grid + 1)) * 3 * raio
                      }));
                };
            
                let ultimo_conjunto = parametros_colunas_grid.slice(-1).pop();
                let tamanho_necessario = ultimo_conjunto.pos_inicial + ultimo_conjunto.largura;
            
                mini_dados["parametros"] = {
                    "posicoes_iniciais" : posicoes_iniciais,
                    "parametros_coluna" : parametros_colunas_grid,
                    "largura_eixo_principal_total" : tamanho_necessario,
                    "largura_eixo_secundario_total" : qde_linhas_grid * 3 * raio,
                    "resumo" : dados_sumarizados,
                    "raio" : raio
                };
            
                //console.log("Mini dados", mini_dados);
            
                return(mini_dados); */
            }
        },

        scales : {

            color : null

        },

        read_data : function() {

            d3.csv("./dados.csv").then(function(data) {

                vis.data.raw = data;
                vis.control.begin();

            })

        }
    },

    render : {

        create_rects : function() {

            const qde_dots_maximo = Math.floor((vis.dims.svg.width - 100) / (vis.params.dots.largura + vis.params.dots.espacamento));

            vis.sels.rects = vis.sels.svg
              .selectAll("rect.pessoas")
              .data(vis.data.raw)
              .join("rect")
              .classed("pessoas", true)
              .attr("height", vis.params.dots.altura)
              .attr("width", vis.params.dots.largura)
              .attr("fill", "khaki")
              .attr("x", (d,i) => vis.dims.svg.margins.left + ( (i%qde_dots_maximo) * (vis.params.dots.largura + vis.params.dots.espacamento) ) )
              .attr("y", (d,i) => vis.dims.svg.margins.top + ( (Math.floor(i/qde_dots_maximo)) * (vis.params.dots.largura + vis.params.dots.espacamento) ) );

        },

        change_colors : function() {

            vis.sels.rects
              .transition()
              .duration(500)
              .attr("fill", d => vis.params.palette[Math.round(Math.random()*4)]);

        },

        update_positions : function(delay) {

            vis.sels.rects
              .transition()
              .duration(1000)
              .delay(delay)
              .attr("x", d => d.pos_longit)
              .attr("y", d => d.pos_across);

        },

        tighten : function(on, delay = 2000) {

            // on: boolean

            vis.sels.rects
              .transition()
              .delay(delay)
              .duration(1000)
              .attr("x", d => d.pos_longit - on * (d.index_longit * vis.params.dots.espacamento))
              .attr("y", d => d.pos_across - on * (d.index_across_group * vis.params.dots.espacamento))

        },

        update_colors : function(delay) {

            const variavel = vis.control.state.current_variable;
            const vetor_categorias = vis.data.sumario.map(d => d.categoria);

            console.log("Variavel atual", vis.control.state.current_variable);

            const color = d3.scaleOrdinal()
              .range(vis.params.palette)
              .domain(vetor_categorias);

            vis.utils.scales.color = color;

            vis.sels.rects
              .transition()
              .delay(delay)
              .duration(1000)
              .attr("fill", d => color(d[variavel]));

        },

        add_labels : function() {

            vis.sels.labels = vis.sels.container_svg
              .selectAll("p.main-label")
              .data(vis.data.sumario)
              .join("p")
              .classed("main-label", true)
              .style("top", d => (vis.dims.svg.margins.top +
              d.ordem * (vis.params.dots.margem_entre_barras + vis.params.from_data.largura_grupo)) + "px" )
              //.style("color", d => vis.utils.scales.color(d.categoria))
              //.style("left", vis.dims.svg.margins.left + "px")
              .html(d => 
                d.categoria + 
                " <strong>" + 
                d.contagem + 
                "</strong> (" + 
                d3.format(".000%")(d.contagem / vis.params.from_data.qde_pontos) + 
                ")");
            
        }



    },

    control : {

        state : {

            current_variable : null

        },

        activates_button : function(all_buttons, clicked) {

            let all_buttons_arr = Array.from(all_buttons);
            // pq o que vem é um HTML Collection

            all_buttons_arr.forEach(button => {
                button.classList.remove("selected");
            })

            clicked.classList.add("selected");
            
        },

        monitor_buttons : function() {

            vis.sels.buttons.on("click", function(e) {

                const opcao = e.target.dataset.opcao;

                vis.control.activates_button(
                    all_buttons = this.children,
                    clicked = e.target
                );

                console.log(opcao);

                vis.control.draw_state(opcao);


            })

        },

        draw_state : function(opcao) {

            vis.control.state.current_variable = opcao;

            vis.utils.data_processing.prepara_dados(
                criterio = opcao,
                ordena = true            
            );

            let delay = 0;
            vis.render.tighten(false, delay = 0);

            vis.render.update_colors(delay = 0);

            vis.render.update_positions(delay = 2000);

            vis.render.tighten(true, delay = 3000);

            vis.render.add_labels();



        },

        initialize_selections : function() {

            // lista referencias
            const refs = Object.keys(vis.refs);

            refs.forEach(referencia => {

                vis.sels[referencia] = d3.select(vis.refs[referencia]);

            })

        },

        begin: function() {

            console.log(vis.data.raw.columns);

            // tudo que depende dos dados vai aqui.

            vis.params.from_data.qde_pontos = vis.data.raw.length;

            vis.utils.sizings.evaluate_bar_widths();

            vis.render.create_rects();

        },

        init : function() {

            vis.control.initialize_selections();
            vis.control.monitor_buttons();
            vis.utils.sizings.get_vsizes();
            vis.utils.sizings.set_vsize_svg();
            vis.utils.read_data();

        }

    }

}

vis.control.init();