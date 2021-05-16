const vis = {

    refs : {

        svg : "svg",
        container_svg : "div.container-svg",
        outer_container_svg : ".outer-container-svg",
        vis_slide : ".slide",
        nav : 'nav',
        seletor : ".selector",
        caixa_selecao : ".seletor-perguntas",
        buttons : ".buttons"

    },

    styles : {

        size_label_secundario : {

            ref   : "--size-label-secundario",
            value : null

        },

        padding_bottom_label : {

            ref   :  "--padding-bottom-label",
            value : null
        }

    },

    sels : {

        svg : null,
        container_svg : null,
        outer_container_svg : null,
        vis : null,
        seletor : null,
        caixa_selecao : null,
        buttons : null,
        rects : null,
        labels : null,
        labels_secundarios : null

    },

    params : {

        dots : {

            largura : 5,
            altura : 5,
            espacamento : 2,
            margem_entre_barras : 50,
            margem_minima_entre_grupos_det : 30

        },

        palette : ["#ea7393", "#f495ab", "#a8596f", "#ccccc4", "khaki"],

        variaveis_detalhamento : ["vinculo", "genero", "cor"],

        pergunta_dados_basicos : 'G3Q00006',

        from_data : {

            qde_pontos             : null,
            qde_fileira            : null,
            qde_fileira_ajustada   : null,
            largura_grupo          : null,
            margem_minima_ajustada : null,

            dominio_var_detalhamento : {

                // usados para os detalhamentos. as chaves aqui precisam corresponder à lista vis.params.variaveis_detalhamento

                "vinculo" : null,
                "genero"  : null,
                "cor"     : null
            }

        },

    },

    dims : {

        vis_slide : null,
        seletor : null,
        nav : null,
        svg : {

            height : null,
            width: null,

            margins : {

                top : 50,
                right: 25,
                bottom: 20,
                left: 16 // depois fazer ele calcular isso.

            }

        }

    },

    data : {

        raw : null,
        selected : null,
        sumario : null,
        maximos_valores_variaveis_detalhamento : null,
        posicoes_iniciais_det : null,

        tipos_perguntas : {}

    },

    utils : {

        sizings : {

            get_vsizes : function() {

                const sizes = ["vis_slide", "nav", "seletor", "buttons"];

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

                const svg_height = vis.dims.vis_slide - vis.dims.nav - vis.dims.seletor - vis.dims.buttons;

                vis.dims.svg.height = svg_height;

                vis.sels.svg.attr("height", svg_height);
                vis.sels.container_svg.style("height", svg_height + "px");

                //vis.sels.outer_container_svg.style("top", vis.dims.seletor + "px");
                vis.sels.outer_container_svg.style("padding-top", vis.dims.seletor + vis.dims.nav + "px");

            },

            evaluate_bar_widths : function() {

                const available_width = vis.dims.svg.width - vis.dims.svg.margins.left - vis.dims.svg.margins.right;

                const quantos_quadradinhos_cabem = Math.floor(available_width / vis.params.dots.largura);

                const qde_fileiras = Math.ceil(vis.params.from_data.qde_pontos / quantos_quadradinhos_cabem);

                vis.params.from_data.qde_fileira = qde_fileiras;
                vis.params.from_data.largura_grupo = qde_fileiras * (vis.params.dots.largura + vis.params.dots.espacamento);

                console.log("Cabem ", quantos_quadradinhos_cabem, " quadradinhos numa fileira. Precisamos de ", qde_fileiras, " fileiras, no pior caso.");

            },

            calcula_qde_fileiras: function(opcao_detalhamento) {

                const maximos = Object.values(vis.data.maximos_valores_variaveis_detalhamento[opcao_detalhamento]);

                const qde_total = d3.sum(maximos);
                let qde_fileira = vis.params.from_data.qde_fileira_ajustada;
                const espaco_unitario = vis.params.dots.largura + vis.params.dots.espacamento;
                const qde_grupos = maximos.length;

                console.log(qde_total, qde_fileira, espaco_unitario, vis.params.dots.margem_minima_entre_grupos_det)

                const espaco_total = 
                  (qde_total / qde_fileira) * espaco_unitario 
                  + vis.params.dots.margem_minima_entre_grupos_det * ( qde_grupos - 1 );

                console.log("Espaço total ", espaco_total);

                const espaco_svg = vis.dims.svg.width - vis.dims.svg.margins.left - vis.dims.svg.margins.right;

                console.log({espaco_svg})

                const espaco_livre = espaco_svg - espaco_total;
                let espaco_entre_grupos = vis.params.dots.margem_minima_entre_grupos_det;

                if (espaco_livre < 0) {

                    console.log("Não tem espaço suficiente", qde_fileira, vis.params.from_data.qde_fileira_ajustada )

                    qde_fileira = ( espaco_unitario * qde_total ) / (espaco_svg - espaco_entre_grupos * (qde_grupos - 1) );

                    qde_fileira = Math.round(qde_fileira);

                    if (vis.params.from_data.qde_fileira_ajustada <= qde_fileira) {

                        console.log("Precisa aumentar a quantidade de fileiras", qde_fileira, vis.params.from_data.qde_fileira_ajustada )

                        vis.params.from_data.qde_fileira_ajustada = qde_fileira;
                        vis.params.from_data.largura_grupo = qde_fileira * (vis.params.dots.largura + vis.params.dots.espacamento);

                    }

                }

            },

            recalcula_margens_subgrupos : function(opcao_detalhamento) {

                const maximos = Object.values(vis.data.maximos_valores_variaveis_detalhamento[opcao_detalhamento]);

                const qde_total = d3.sum(maximos);
                let qde_fileira = vis.params.from_data.qde_fileira_ajustada;
                const espaco_unitario = vis.params.dots.largura + vis.params.dots.espacamento;
                const qde_grupos = maximos.length;

                const espaco_total = 
                  (qde_total / qde_fileira) * espaco_unitario 
                  + vis.params.dots.margem_minima_entre_grupos_det * ( qde_grupos - 1 );

                console.log("Espaço total ", espaco_total);

                const espaco_svg = vis.dims.svg.width - vis.dims.svg.margins.left - vis.dims.svg.margins.right;

                console.log({espaco_svg})

                const espaco_livre = espaco_svg - espaco_total;

                if (espaco_livre > 0) {

                    console.log("tem espaço sobrando, a margem que era ", vis.params.from_data.margem_minima_ajustada, ", agora vai ficar ", espaco_livre / (qde_grupos - 1))

                    vis.params.from_data.margem_minima_ajustada = espaco_livre / (qde_grupos - 1);

                } else {

                    vis.params.from_data.margem_minima_ajustada = vis.params.dots.margem_minima_entre_grupos_det;

                }

            },

            recalcula_altura_svg : function() {

                const qde_categorias = vis.data.sumario.length;
                const qde_fileiras   = vis.params.from_data.qde_fileira_ajustada;
                const tamanho_unitario = vis.params.dots.largura + vis.params.dots.espacamento;
                const margem = vis.params.dots.margem_entre_barras;

                const area_transversal_grafico = 
                  qde_categorias * qde_fileiras * tamanho_unitario +
                  (qde_categorias - 1) * margem;

                const altura_svg = vis.dims.svg.height;

                const altura_liquida_svg = altura_svg - vis.dims.svg.margins.top - vis.dims.svg.margins.bottom;

                let ajuste = area_transversal_grafico - altura_liquida_svg;
                
                if (ajuste < 0) {

                    ajuste = 0

                };

                vis.sels.svg.attr("height", altura_svg + ajuste);
                vis.sels.container_svg.style("height", altura_svg + ajuste + "px");

            },

            convertRemToPixels : function(rem) {    
                return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
            }

        },

        data_processing : {

            sumariza_dados : function(criterio, ordena = false, vetor_ordem) {

                const sumario = [];
                const dados = vis.data.selected;
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

                // para alinhar no modo detalhado, precisamos calcular o valor máximo para cada categoria de cada variável de detalhamento.
                // por exemplo, se estamos vendo "vínculo", e o usuário pede para detalhar os valores dos diversos vínculos por gênero, é preciso saber quais as maiores contagens de cada combinação vínculo x gênero, para cada gênero. Ou seja, para o gênero feminino, qual a maior contagem, considerando os diversos vínculos?

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

                const dados = vis.data.selected;

                // determina valores únicos
                let dados_sumarizados = this.sumariza_dados(criterio, ordena, vetor_ordem);

                console.log(dados_sumarizados);
            
                //let contagem_maxima = d3.max(dados_sumarizados, d => d.contagem);

                //const largura_across_grupo = qde_linhas_grid * (vis.params.dots.largura + vis.params.dots.espacamento);
            
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


                // agora que temos os maximos, novo loop para usar esses máximos para calcular onde deve começar cada subgrupo do detalhamento
                const posicoes_iniciais_detalhamento = {};

                console.log(maximos);

                // vamos testar se os pontos com a quantidade de fileiras atual, os subgrupos do detalhamento e o espacamento entre subgrupos caberiam na largura do svg. se não couber, vamos aumentar a quantidade de fileiras.

                // começa setando a qde_fileiras que vai ser calculada para o valor inicial padrão
                vis.params.from_data.qde_fileira_ajustada = vis.params.from_data.qde_fileira;

                Object.keys(maximos).forEach(variavel_detalhamento => {

                    vis.utils.sizings.calcula_qde_fileiras(variavel_detalhamento);

                });

                let qde_linhas_grid = vis.params.from_data.qde_fileira_ajustada; //Math.ceil(Math.sqrt(contagem_maxima));

                // tem que ser separado, pq ele tem que ficar com uma quantidade só de fileiras. as margens podem ser diferentes.

                Object.keys(maximos).forEach(variavel_detalhamento => {

                    // acrescenta isso aqui para recalcular margens entre subgrupos
                    // vis.utils.sizings.recalcula_margens_subgrupos(variavel_detalhamento);
                    ////////////

                    // como agora calculamos a qde de fileiras necessária para caber com o espacamento mínimo indicado, e recalculamos a altura do svg se for necessário, não precisa mais recalcular as margens entre grupos.

                    const dominio = vis.params.from_data.dominio_var_detalhamento[variavel_detalhamento];
                    let posicao_acumulada = 0; // fora a margem lateral esquerda, mas vamos incluí-la no cálculo mais adiante

                    posicoes_iniciais_detalhamento[variavel_detalhamento] = {};

                    dominio.forEach(valor_variavel_detalhamento => {

                        posicoes_iniciais_detalhamento[variavel_detalhamento][valor_variavel_detalhamento] = posicao_acumulada;

                        const qde_maxima = maximos[variavel_detalhamento][valor_variavel_detalhamento];

                        const qde_fileiras_longitudinais_grupo = Math.ceil(qde_maxima / qde_linhas_grid);

                        const tamanho_atual = qde_fileiras_longitudinais_grupo * (vis.params.dots.largura + vis.params.dots.espacamento) + vis.params.dots.margem_minima_entre_grupos_det;

                        posicao_acumulada += tamanho_atual;

                    });

                });

                console.log("POSICOES INICIAIS ", posicoes_iniciais_detalhamento);

                /////////
                // constroi vetor de posicoes iniciais

                vis.data.posicoes_iniciais_det = {};

                Object.keys(posicoes_iniciais_detalhamento).forEach(variavel_detalhamento => {

                    const labels   = Object.keys(posicoes_iniciais_detalhamento[variavel_detalhamento]);
                    const posicoes = Object.values(posicoes_iniciais_detalhamento[variavel_detalhamento]);

                    const vetor = labels.map((d,i) => (
                        {
                            label : d == "Servidor(a) técnico(a)/ administrativo(a)" ? "Servidor" : d,
                            posicao : posicoes[i]
                        })
                    );

                    vis.data.posicoes_iniciais_det[variavel_detalhamento] = vetor;

                });

                //////////

                ///////////
                // agora passa por todo o dataset calculando as posições

                dados.forEach((element,i) => {

                    // "criterio" é  variável de interesse no momento

                    const valor_atual_para_a_variavel = element[criterio];

                    const parametros_grupo = indice_grupos[valor_atual_para_a_variavel]

                    const grupo = parametros_grupo.ordem;
                    const index_across_group = parametros_grupo.indice_atual % ( qde_linhas_grid );//+ 1);
                    
                    const index_longit = Math.floor( parametros_grupo.indice_atual / ( qde_linhas_grid )); //+ 1) );


                    element.group = grupo;
                    element.index_across_group = index_across_group;
                    element.index_longit = index_longit;

                    element.pos_across = 
                      vis.dims.svg.margins.top +
                      grupo * (vis.params.dots.margem_entre_barras + vis.params.from_data.largura_grupo) + index_across_group * (vis.params.dots.largura + vis.params.dots.espacamento);

                    element.pos_longit = vis.dims.svg.margins.left + index_longit * (vis.params.dots.largura + vis.params.dots.espacamento);

                    // incrementa o contador para esse valor da variavel

                    indice_grupos[valor_atual_para_a_variavel].indice_atual++

                    ///////////////
                    ///// para o cálculo das posições nos detalhamentos

                    const posicoes_nos_detalhamentos = {};

                    const detalhamentos_possiveis = Object.keys(parametros_grupo.indices_detalhamentos);

                    detalhamentos_possiveis.forEach(variavel_detalhamento => {

                        const valor_atual_variavel_detalhamento = element[variavel_detalhamento];

                        const indice_atual_det = parametros_grupo
                          .indices_detalhamentos
                          [variavel_detalhamento]
                          [valor_atual_variavel_detalhamento]
                          .indice_atual_detalhamento 

                        const index_across_subgroup = indice_atual_det % (qde_linhas_grid ); //+ 1);

                        const index_longit_subgroup = Math.floor( 
                            indice_atual_det / ( qde_linhas_grid )); //+ 1) );

                        const posicao_inicial_longit_subgroup = posicoes_iniciais_detalhamento
                          [variavel_detalhamento]
                          [valor_atual_variavel_detalhamento];

                        //if (valor_atual_variavel_detalhamento == "Branca" & valor_atual_para_a_variavel == "Docente") console.log(valor_atual_para_a_variavel,valor_atual_variavel_detalhamento, indice_atual_det, index_longit_subgroup, index_across_subgroup, posicao_inicial_longit_subgroup);


                        posicoes_nos_detalhamentos[variavel_detalhamento] = {

                            pos_across_subgroup : vis.dims.svg.margins.top +
                            grupo * (vis.params.dots.margem_entre_barras + vis.params.from_data.largura_grupo) + index_across_subgroup * (vis.params.dots.largura + vis.params.dots.espacamento),

                            pos_longit_subgroup : vis.dims.svg.margins.left + index_longit_subgroup * (vis.params.dots.largura + vis.params.dots.espacamento) + posicao_inicial_longit_subgroup

                        }

                        // incorpora essas posicoes no dataset
                        element.posicao_detalhamento = posicoes_nos_detalhamentos;

                        // incrementa o índice relativo

                        indice_grupos
                        [valor_atual_para_a_variavel]
                        .indices_detalhamentos
                        [variavel_detalhamento]
                        [valor_atual_variavel_detalhamento]
                        .indice_atual_detalhamento++;

                    });

                    ///////////

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

        get_styles : function(ref_style) {

            let  style = getComputedStyle(document.documentElement).getPropertyValue(vis.styles[ref_style].ref).slice(1);

            vis.styles[ref_style].value = style;



        },

        read_data : function() {

            d3.json("./output.json").then(function(data) {

                vis.data.raw = data;
                vis.control.begin();

            })

        }
    },

    render : {

        create_rects : function() {

            const svg_net_width = vis.dims.svg.width - ( vis.dims.svg.margins.left + vis.dims.svg.margins.right );

            const svg_net_height = vis.dims.svg.height - ( vis.dims.svg.margins.top + vis.dims.svg.margins.bottom );

            const qde_dots_maximo = Math.floor( (svg_net_width) / (vis.params.dots.largura + vis.params.dots.espacamento) );

            const espacamento = Math.sqrt((svg_net_width * svg_net_height) / vis.params.from_data.qde_pontos);

            const n_w = Math.ceil(svg_net_width / espacamento);
            const n_h = Math.floor(svg_net_height / espacamento);

            vis.sels.rects = vis.sels.svg
              .selectAll("rect.pessoas")
              .data(vis.data.selected)
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

        update_positions_detalhamento : function(opcao_detalhamento, delay) {

            vis.sels.rects
              .transition()
              .duration(1000)
              .delay(delay)
              .attr("x", d => d.posicao_detalhamento[opcao_detalhamento].pos_longit_subgroup)
              .attr("y", d => d.posicao_detalhamento[opcao_detalhamento].pos_across_subgroup);

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
            
        },

        add_labels_detalhamento : function(move_principal, detalhamento, delay) {

            // desloca os labels principais

            if (move_principal) {

                vis.sels.labels
                    .filter((d,i) => i == 0)
                    .transition()
                    .delay(delay)
                    .duration(1000)
                    .style("top", function(d) {
    
                        const label = d3.select(this);
                        //const altura = +label.style("height").slice(0,-2);
                        const altura = vis.styles.size_label_secundario.value.slice(0,-2);
                        const top = +label.style("top").slice(0,-2);
                        const padding = vis.styles.padding_bottom_label.value.slice(0,-2);
                        console.log(altura, top, top - altura);
        
                        return (top - altura - padding) + "px"
    
                    })
                ;

            }

            // acrescenta as secundárias

            const detalhamentos = vis.data.posicoes_iniciais_det[detalhamento];
            //Object.keys(vis.data.sumario[variavel].dados_detalhamento[detalhamento]);

            vis.sels.labels_secundarios = vis.sels.container_svg
              .selectAll("p.sec-label")
              .data(detalhamentos)
              .join("p")
              .classed("sec-label", true)
              .style("top", d => (vis.dims.svg.margins.top + "px" ))
            //.style("color", d => vis.utils.scales.color(d.categoria))
              .style("left", d => vis.dims.svg.margins.left + d.posicao + "px")
              .text(d => d.label)
              .style("opacity", 0);

            vis.sels.labels_secundarios
                .transition()
                .delay(delay)
                .duration(1000)
                .style("opacity", 1);

        }

    },

    selectors : {

        ref_principal : '.seletor-perguntas',

        ref_subquestoes : '.seletor-subquestoes',

        popula_perguntas : function() {

            const seletores = document.querySelectorAll(this.ref_principal);

            seletores.forEach(seletor => {

                const nome_bloco = seletor.dataset.bloco;

                const bloco = vis.data.raw[nome_bloco]

                const cod_questoes = Object.keys(bloco);

                cod_questoes.forEach(questao => {
                    
                    const nome_completo = bloco[questao].nome_completo[0];
                    const tipo_pergunta = bloco[questao].tipo[0];

                    const new_option = document.createElement('option');

                    new_option.value = questao; //== vis.params.pergunta_dados_basicos ? 'resposta' : questao; //1
                    //1 - gambiarra para os dados básicos, que estão no bloco facetas, nessa pergunta que foi guardadada em vis.params.pergunta_dados_basicos...

                    // cria um dicionario questao : tipo
                    vis.data.tipos_perguntas[questao] = tipo_pergunta;
                    //new_option.dataset.tipoPergunta = tipo_pergunta;
                    new_option.text = nome_completo + ' (' + questao + ')';

                    seletor.append(new_option);
                    
                });

            })

        },

        limpa_subquestoes : function(bloco) {

            const seletor = document.querySelector(this.ref_subquestoes + '[data-bloco = "' + bloco + '"]');

            while (seletor.firstChild) {
                seletor.removeChild(seletor.firstChild);
            }

        },

        toggle_seletor_subquestoes : function(bloco, toggle = 'esconde') {

            // esconde / mostra

            const seletor = document.querySelector(this.ref_subquestoes + '[data-bloco = "' + bloco + '"]');

            const container = seletor.parentElement;

            const method = toggle == 'esconde' ? 'add' : 'remove';

            container.classList[method]('escondido');


        },

        popula_subquestoes : function(bloco, questao) {

            const seletor = document.querySelector(this.ref_subquestoes + '[data-bloco = "' + bloco + '"]');

            console.log('seletor: ', seletor);

            console.log('opa, populando subquestoes...', questao);

            const subquestoes = Object.keys(vis.data.raw[bloco][questao].dados);

            this.toggle_seletor_subquestoes(bloco, 'mostra');

            // popula com novos

            subquestoes.forEach( (subquestao, i) => {

                const new_option = document.createElement('option');

                new_option.value = i;

                new_option.text = subquestao;

                seletor.append(new_option);

            });

        },

        monitor_selector : function() {

            const seletores = document.querySelectorAll(this.ref_principal);

            seletores.forEach(function(seletor) {

                console.log('monitoring seletor ', seletor.dataset.bloco);

                seletor.addEventListener('change', function(e) {

                    const questao = e.target.value;
                    const tipo = vis.data.tipos_perguntas[questao]

                    const bloco = e.target.dataset.bloco;

                    // limpa subquestoes

                    vis.selectors.limpa_subquestoes(bloco);

                    console.log("Usuário escolheu a opção ", questao, ", é uma pergunta do tipo ", tipo);
                    console.log(e);
                    console.log(e.target, e.target.dataset.bloco);

                    if (tipo == 'multiplas com escala') {

                        vis.selectors.popula_subquestoes(bloco, questao);
                        // aciona flag (para o cálculo do tamanho do svg)
                        vis.control.state.tem_subquestao = true;

                    } else {

                        // hide subquestoes
                        vis.selectors.toggle_seletor_subquestoes(bloco, 'esconde');

                        vis.control.state.tem_subquestao = false;


                        // render
                        vis.control.draw_state(bloco, questao);

                    }

                })

            })

            // vis.sels.caixa_selecao.on("change", function(e) {

            //     // se tiver um botao selecionado, tira a seleção
            //     vis.control.deactivates_buttons();

            //     const opcao = e.target.value;

            //     const tipo = e.target.dataset.tipoPergunta;

            //     console.log("Usuário escolheu a opção ", opcao, ", é uma pergunta do tipo ", tipo);

            //     if (opcao != "nenhum") {

            //         //vis.control.draw_state(opcao);

            //     }

            //     // testa se a opcão escolhida no seletor é uma das variáveis de detalhamento, e desabilita o botão respectivo, se for

            //     vis.control.habilita_botoes();

            //     if (vis.params.variaveis_detalhamento.includes(opcao)) {
            //         vis.control.desabilita_botao(opcao);
            //     } 

            // })

        },

    },

    control : {

        state : {

            first_transition : true,
            first_delhamento : true,
            current_questao : null,
            current_bloco: null,
            current_variable : null,
            current_detalhamento: "nenhum",
            tem_subquestao : false

        },

        activates_button : function(all_buttons, clicked) {

            let all_buttons_arr = Array.from(all_buttons);
            // pq o que vem é um HTML Collection

            all_buttons_arr.forEach(button => {
                button.classList.remove("selected");
            })

            clicked.classList.add("selected");
            
        },

        deactivates_buttons : function() {

            const all_buttons_arr = Array.from(vis.sels.buttons.node().children);

            all_buttons_arr.forEach(button => {
                button.classList.remove("selected");
            })       

        },

        desabilita_botao : function(opcao) {

            const all_buttons_arr = Array.from(vis.sels.buttons.node().children);

            // para o inicio
            if (opcao == "todos") {

                all_buttons_arr.forEach(button => button.classList.add("desabilitado"));

            } else {

                const button = all_buttons_arr.filter(d => d.dataset.opcao == opcao)[0];

                button.classList.add("desabilitado");   
                vis.control.state.current_detalhamento = "nenhum";

            }

        },

        habilita_botoes : function() {

            const all_buttons_arr = Array.from(vis.sels.buttons.node().children);

            all_buttons_arr.forEach(button => {
                button.classList.remove("desabilitado");
            })

        },

        remove_labels_detalhamento : function() {

            if (vis.sels.labels_secundarios) vis.sels.labels_secundarios.remove();

        },

        monitor_buttons : function() {

            vis.sels.buttons.on("click", function(e) {

                if (e.target.tagName == "BUTTON") {

                    const opcao_detalhamento = e.target.dataset.opcao;

                    vis.control.activates_button(
                        all_buttons = this.children,
                        clicked = e.target
                    );

                    console.log(opcao_detalhamento);

                    if (opcao_detalhamento == "nenhum") {

                        console.log("Variavel atual", vis.control.state.current_variable);

                        vis.control.state.current_detalhamento = "nenhum";
                        vis.control.draw_state(vis.control.state.current_variable);
                        

                    } else {

                        vis.control.draw_state_detalhado(opcao_detalhamento);

                    }    
                
                } else console.log("Isso não é um botão, brother.")

            })

        },

        draw_state : function(bloco, questao) {

            console.log('renderizar...', bloco, questao);

            // a opcao agora a ser selecionada é sempre o campo 'resposta'. Só é preciso passar o dataset correto, conforme a seleção do bloco e questão.
            // a não ser que sejam as facetas, aí a opção vai ser a "questão" (que na verdade traz o valor da opção selecionada, que, no caso do bloco facetas, são os nomes das variáveis de detalhamento)

            let opcao;

            if ( vis.params.variaveis_detalhamento.includes(questao) ) {

                opcao = questao;
                questao = vis.params.pergunta_dados_basicos;

            } else {

                opcao = 'resposta';

            }

            console.log(opcao, questao);

            vis.data.selected = vis.data.raw[bloco][questao].dados;

            if (vis.control.state.first_transition) {
                vis.control.state.first_transition = false;
            } else {
                vis.render.tighten(false, delay = 0);
            }

            console.log("Desenhar estado ", opcao, vis.control.state.current_variable);

            vis.control.state.current_bloco = bloco;
            vis.control.state.current_questao = questao;
            vis.control.state.current_variable = opcao;
            vis.control.state.current_detalhamento = "nenhum";
            vis.control.remove_labels_detalhamento();
            vis.control.state.first_detalhamento = true;

            vis.utils.data_processing.prepara_dados(
                criterio = opcao,
                ordena = true            
            );

            vis.utils.sizings.recalcula_altura_svg();

            vis.render.update_colors(delay = 1000);

            vis.render.update_positions(delay = 2000);

            vis.render.tighten(true, delay = 3000);

            vis.render.add_labels(delay = 2000);

        },

        draw_state_detalhado : function(opcao_detalhamento) {

            if (vis.control.state.current_variable != opcao_detalhamento) {

                vis.control.state.current_detalhamento = opcao_detalhamento;

                vis.render.tighten(false, delay = 0)
                vis.render.update_positions_detalhamento(opcao_detalhamento, delay = 1000);

            } else {

                vis.control.state.current_detalhamento = "nenhum";

            }

            console.log(vis.control.state.first_detalhamento);

            let move_principal = false;

            if (vis.control.state.first_detalhamento) {
                vis.control.state.first_detalhamento = false;
                move_principal = true;
            } 

            vis.render.add_labels_detalhamento(move_principal, opcao_detalhamento, 1000);

        },

        initialize_selections : function() {

            // lista referencias
            const refs = Object.keys(vis.refs);

            refs.forEach(referencia => {

                vis.sels[referencia] = d3.select(vis.refs[referencia]);

            })

        },

        initialize_styles : function() {

            Object.keys(vis.styles).forEach(estilo => vis.utils.get_styles(estilo));

        },

        begin: function() {

            console.log(vis.data.raw.columns);

            // tudo que depende dos dados vai aqui.

            vis.selectors.popula_perguntas();

            // inicializa data selected
            vis.data.selected = vis.data.raw.facetas[vis.params.pergunta_dados_basicos].dados;

            vis.params.from_data.qde_pontos = vis.data.selected.length;

            vis.utils.data_processing.gera_dominio_ordenado_variaveis_detalhamento();

            vis.utils.sizings.evaluate_bar_widths();

            vis.render.create_rects();

        },

        init : function() {

            vis.control.initialize_selections();
            vis.control.monitor_buttons();
            vis.control.desabilita_botao("todos");
            vis.selectors.monitor_selector();
            vis.control.initialize_styles();
            vis.utils.sizings.get_vsizes();
            vis.utils.sizings.set_vsize_svg();
            vis.utils.read_data();

        }

    }

}

vis.control.init();