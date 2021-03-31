const vis = {

    refs : {

        svg : "svg",
        container_svg : "div.container-svg",
        vis : "div.vis",
        seletor : "div.selector"

    },

    sels : {

        svg : null,
        container_svg : null,
        vis : null,
        seletor : null,
        rects : null

    },

    params : {

        dots : {

            largura : 5,
            altura : 5,
            espacamento : 1,
            margem_entre_barras : 20

        },

        palette : ["#ea7393", "#f495ab", "#a8596f", "#ccccc4", "#643b45"],

        from_data : {

            qde_pontos : null,
            qde_fileira : null

        }

    },

    dims : {

        vis : null,
        seletor : null,
        svg : {

            height : null,
            width: null,

            margins : {

                top : 20,
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
            
                if (vetor_ordem) categorias_unicas = vetor_ordem;
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
            
                    sumario.push({"categoria" : cat,
                                  "contagem"  : cont,
                                  "criterio"  : criterio});                 
                }
            
                if (ordena) sumario.sort((a,b) => b.contagem - a.contagem);
            
                return sumario;    
    
            },

            prepara_dados : function(criterio, ordena = false, vetor_ordem, raio, margem) {

                const dados = vis.data.raw;

                // determina valores únicos
                let dados_sumarizados = this.sumariza_dados(dados, criterio, ordena, vetor_ordem);
            
                let contagem_maxima = d3.max(dados_sumarizados, d => d.contagem);
            
                let qde_linhas_grid = vis.params.from_data.qde_fileira; //Math.ceil(Math.sqrt(contagem_maxima));
            
                let parametros_colunas_grid = dados_sumarizados.map(d => {
                    const qde_colunas = Math.ceil(d.contagem/qde_linhas_grid);
                    return({ 
                        "categoria" : d.categoria,
                        "largura" : qde_colunas * (vis.params.dots.largura + vis.params.dots.espacamento)
                      }
                    )
                });
            
                let pos_inicial_ac = 0;
            
                let posicoes_iniciais = {};

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

        }



    },

    control : {

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
            vis.utils.sizings.get_vsizes();
            vis.utils.sizings.set_vsize_svg();
            vis.utils.read_data();

        }

    }

}

vis.control.init();