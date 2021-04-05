const vis = {

    refs : {

        svg : "svg",
        container_svg : "div.container-svg",
        vis : "div.vis",
        seletor : "div.selector",
        caixa_selecao : "#seletor-perguntas",
        buttons : ".buttons"

    },

    sels : {

        svg : null,
        container_svg : null,
        vis : null,
        seletor : null,
        caixa_selecao : null,
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

        variaveis_detalhamento : ["vinculo", "genero", "cor"],

        from_data : {

            qde_pontos    : null,
            qde_fileira   : null,
            largura_grupo : null,

            dominio_var_detalhamento : {

                // usados para os detalhamentos. as chaves aqui precisam corresponder à lista vis.params.variaveis_detalhamento

                "vinculo" : null,
                "genero"  : null,
                "cor"     : null
            }

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
                left: 16 // depois fazer ele calcular isso.

            }

        }

    },

    data : {

        raw : null,
        sumario : null,
        maximos_valores_variaveis_detalhamento : null

    },

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis", "seletor", "buttons"];

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

                const svg_height = vis.dims.vis - vis.dims.seletor - vis.dims.buttons;

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

                // para alinhar no modo detalhado, precisamos calcular o valor máximo para cada ocorrencia dos valores presentes nas variáveis de detalhamento.
                // por exemplo, se estamos vendo "vínculo", e o usuário pede para detalhar os valores dos diversos vínculos por gênero, é preciso saber quais as maiores contagens de cada combinação vínculo x gênero, para cada gênero 
                const maximos_valores_variaveis_detalhamento = {};
                /////////

            
                // faz a contagem dos casos para cada valor único da variável categórica
            
                for (cat of categorias_unicas) {

                    const subdados = dados
                      .filter(d => d[criterio] === cat);

                    const cont = subdados.length;

                    // ///////////////
                    // acrescenta cálculo dos subgrupos
                    // mas só se já houver uma variável selecionado

                    const tamanhos_subgrupos = {};

                    if (vis.control.state.current_variable != null) {

                        // loop sobre as variáveis principais que foram escolhidas para detalhamento

                        vis.params.variaveis_detalhamento.forEach(variavel => {

                            if (variavel != criterio) {

                                // para calcular os máximos
                                maximos_valores_variaveis_detalhamento[variavel] = {};
                                ////////

                                tamanhos_subgrupos[variavel] = {};

                                // aí agora vamos fazer um loop sobre o domínio de cada uma dessas variáveis, para pegar a contagem de cada um
                                vis.params.from_data.dominio_var_detalhamento[variavel]
                                  .forEach(elemento_do_dominio => {

                                      // para calcular os máximos                         
                                      maximos_valores_variaveis_detalhamento
                                      [variavel]
                                      [elemento_do_dominio] = 0
                                      ///////

                                      const cont_dominio = subdados
                                        .filter(d => d[variavel] == elemento_do_dominio)
                                        .length;
                                
                                      tamanhos_subgrupos[variavel][elemento_do_dominio] = cont_dominio;
                                })


                            }

                        });

                    }
            
                    sumario.push({"categoria"          : cat,
                                  "contagem"           : cont,
                                  "criterio"           : criterio,
                                  "dados_detalhamento" : tamanhos_subgrupos
                                });
                                  
                }
            
                if (ordena) sumario.sort((a,b) => b.contagem - a.contagem);

                vis.data.sumario = sumario;
                vis.data.maximos_valores_variaveis_detalhamento = maximos_valores_variaveis_detalhamento;
            
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
                const maximos = vis.data.maximos_valores_variaveis_detalhamento;

                dados_sumarizados.forEach((d,i) => {

                    // d aqui vai ser cada uma das categorias da questao selecionada

                    d.ordem = i;

                    //////////

                    // inclusão por causa dos detalhamentos

                    const indice_detalhamentos = {};

                    const variaveis_detalhamento = Object.keys(d.dados_detalhamento);

                    variaveis_detalhamento.forEach(variavel => {

                        indice_detalhamentos[variavel] = {};
                        // para cada variavel presente, vamos fazer um loop sobre seus valores


                        Object.keys(d.dados_detalhamento[variavel]).forEach((valor, indice) => {

                            const qde = d.dados_detalhamento[variavel][valor];

                            // para computar os máximos, para o detalhamento
                            if (qde > maximos[variavel][valor]) {
                                maximos[variavel][valor] = qde;
                            }
                            ///////

                            indice_detalhamentos[variavel][valor] = {
                                ordem : indice,
                                quantidade : qde,
                                indice_atual_detalhamento : 0
                            }

                        

                        });

                    });

                    //////////

                    indice_grupos[d.categoria] = {

                        ordem : i,
                        indice_atual : 0,
                        indices_detalhamentos : indice_detalhamentos

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

                    element.pos_longit = vis.dims.svg.margins.left + index_longit * (vis.params.dots.largura + vis.params.dots.espacamento);

                    // incrementa o contador para esse valor da variavel

                    indice_grupos[valor_atual_para_a_variavel].indice_atual++

                    ///// para o cálculo das posições nos detalhamentos

                    const posicoes_nos_detalhamentos = {};

                    const detalhamentos_possiveis = Object.keys(parametros_grupo.indices_detalhamentos);




                    

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
            },

            gera_dominio_ordenado_variaveis_detalhamento : function() {

                console.log("Gerando domínio")

                vis.params.variaveis_detalhamento.forEach(variavel => {
                    const sumario_variavel = vis.utils.data_processing.sumariza_dados(
                        criterio = variavel, 
                        ordena = true)

                    console.log("Variável atual: ", variavel);

                    vis.params.from_data.dominio_var_detalhamento[variavel] = sumario_variavel
                      .map(d => d.categoria);

                });

            },

            gera_posicoes_detalhamento : function() {




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

            const espacamento = Math.sqrt((vis.dims.svg.width * vis.dims.svg.height) / vis.params.from_data.qde_pontos);

            const n_w = Math.ceil(vis.dims.svg.width / espacamento);
            const n_h = Math.floor(vis.dims.svg.height / espacamento);

            vis.sels.rects = vis.sels.svg
              .selectAll("rect.pessoas")
              .data(vis.data.raw)
              .join("rect")
              .classed("pessoas", true)
              .attr("height", vis.params.dots.altura)
              .attr("width", vis.params.dots.largura)
              .attr("fill", "#70424E")
              .attr("x", (d,i) => vis.dims.svg.margins.left + ( (i % n_w) * espacamento ) )
              .attr("y", (d,i) => vis.dims.svg.margins.top + ( (Math.floor(i/n_w)) * espacamento) );

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

        tighten : function(on, delay) {

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

        add_labels : function(delay) {

            vis.sels.labels = vis.sels.container_svg
              .selectAll("p.main-label")
              .data(vis.data.sumario)
              .join("p")
              .classed("main-label", true)
              .style("top", d => (vis.dims.svg.margins.top +
              d.ordem * (vis.params.dots.margem_entre_barras + vis.params.from_data.largura_grupo)) + "px" )
              //.style("color", d => vis.utils.scales.color(d.categoria))
              .style("left", vis.dims.svg.margins.left + "px")
              .html(d => 
                d.categoria + 
                " <strong>" + 
                d.contagem + 
                "</strong> (" + 
                d3.format(".000%")(d.contagem / vis.params.from_data.qde_pontos) + 
                ")")
              .style("opacity", 0);

            vis.sels.labels
              .transition()
              .delay(delay)
              .duration(1000)
              .style("opacity", 1);
            
        }



    },

    control : {

        state : {

            first_transition : true,
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

        monitor_selector : function() {

            vis.sels.caixa_selecao.on("change", function(e) {

                const opcao = e.target.value;

                console.log("Usuário escolheu a opção ", opcao);

                if (opcao != "nenhum") {

                    vis.control.draw_state(opcao);

                }

            })

        },

        monitor_buttons : function() {

            vis.sels.buttons.on("click", function(e) {

                if (e.target.tagName == "BUTTON") {

                    const opcao = e.target.dataset.opcao;

                    vis.control.activates_button(
                        all_buttons = this.children,
                        clicked = e.target
                    );

                    console.log(opcao);

                    vis.control.draw_state(opcao);
                
                } else console.log("Isso não é um botão, brother.")

            })

        },

        draw_state : function(opcao) {

            if (vis.control.state.first_transition) {
                vis.control.state.first_transition = false;
            } else {
                vis.render.tighten(false, delay = 0);
            }

            vis.control.state.current_variable = opcao;

            vis.utils.data_processing.prepara_dados(
                criterio = opcao,
                ordena = true            
            );

            vis.render.update_colors(delay = 1000);

            vis.render.update_positions(delay = 2000);

            vis.render.tighten(true, delay = 3000);

            vis.render.add_labels(delay = 2000);



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

            vis.utils.data_processing.gera_dominio_ordenado_variaveis_detalhamento();

            vis.utils.sizings.evaluate_bar_widths();

            vis.render.create_rects();

        },

        init : function() {

            vis.control.initialize_selections();
            vis.control.monitor_buttons();
            vis.control.monitor_selector();
            vis.utils.sizings.get_vsizes();
            vis.utils.sizings.set_vsize_svg();
            vis.utils.read_data();

        }

    }

}

vis.control.init();